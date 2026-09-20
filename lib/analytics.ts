import { prisma } from "@/lib/prisma";

export interface DailyRevenuePoint {
  /** Format "YYYY-MM-DD". */
  date: string;
  /** Label pendek untuk ditampilkan di chart, mis. "12 Sep". */
  label: string;
  revenue: number;
  orderCount: number;
}

export interface MonthlyRevenuePoint {
  /** Format "YYYY-MM". */
  month: string;
  /** Label pendek untuk ditampilkan di chart, mis. "Sep 2026". */
  label: string;
  revenue: number;
  orderCount: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
}

export interface GameBreakdown {
  gameId: string;
  gameName: string;
  accentColor: string;
  orderCount: number;
  revenue: number;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  completedOrders: number;
  activeOrders: number;
  cancelledOrders: number;
  dailyRevenue: DailyRevenuePoint[];
  monthlyRevenue: MonthlyRevenuePoint[];
  statusBreakdown: StatusBreakdown[];
  gameBreakdown: GameBreakdown[];
}

const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" });
const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric" });

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function toMonthKey(date: Date): string {
  return date.toISOString().slice(0, 7); // "YYYY-MM"
}

/**
 * Ambil & agregasi data analitik untuk dashboard admin. `rangeDays`
 * menentukan seberapa jauh ke belakang tren HARIAN dihitung (default 30
 * hari) -- tren BULANAN selalu 12 bulan terakhir terlepas dari rangeDays,
 * dan ringkasan (totalRevenue, statusBreakdown, dst) selalu mencakup
 * SEMUA order sepanjang waktu, bukan cuma dalam rangeDays.
 *
 * Pendekatan: fetch order (field seperlunya saja) dalam rentang waktu yang
 * relevan, lalu agregasi manual di JS -- lebih portable & mudah dibaca
 * daripada raw SQL groupBy per tanggal, dan untuk skala order toko joki
 * volumenya masih wajar diproses di memori (lihat catatan index baru di
 * Order.createdAt untuk menjaga query tetap cepat seiring data bertambah).
 */
export async function getAnalyticsSummary(rangeDays = 30): Promise<AnalyticsSummary> {
  const now = new Date();
  const chartStartDate = new Date(now);
  chartStartDate.setDate(chartStartDate.getDate() - Math.max(rangeDays, 365) + 1);
  chartStartDate.setHours(0, 0, 0, 0);

  const [ordersInRange, statusCounts, gameCounts] = await Promise.all([
    // Dipakai untuk tren harian & bulanan (butuh createdAt & totalPrice per
    // order individual, tidak bisa cuma count()).
    prisma.order.findMany({
      where: { createdAt: { gte: chartStartDate } },
      select: { createdAt: true, totalPrice: true, status: true },
      orderBy: { createdAt: "asc" },
    }),
    // Breakdown status & total keseluruhan dihitung TERPISAH dari
    // ordersInRange (yang dibatasi chartStartDate) supaya tetap akurat
    // mencakup seluruh riwayat, bukan cuma 12 bulan terakhir.
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.order.groupBy({
      by: ["gameId"],
      _count: { _all: true },
      _sum: { totalPrice: true },
    }),
  ]);

  const games = await prisma.game.findMany({
    where: { id: { in: gameCounts.map((g) => g.gameId) } },
    select: { id: true, name: true, accentColor: true },
  });
  const gameById = new Map(games.map((g) => [g.id, g]));

  // === Ringkasan keseluruhan (semua order, tidak dibatasi rentang) ===
  const totalOrders = statusCounts.reduce((sum, s) => sum + s._count._all, 0);
  const totalRevenue = gameCounts.reduce((sum, g) => sum + (g._sum.totalPrice ?? 0), 0);
  const completedOrders = statusCounts.find((s) => s.status === "SELESAI")?._count._all ?? 0;
  const cancelledOrders = statusCounts.find((s) => s.status === "DIBATALKAN")?._count._all ?? 0;
  const activeOrders = statusCounts
    .filter((s) => ["MENUNGGU", "DIKERJAKAN", "FINISHING"].includes(s.status))
    .reduce((sum, s) => sum + s._count._all, 0);

  // === Tren harian (rangeDays terakhir) ===
  const dailyRangeStart = new Date(now);
  dailyRangeStart.setDate(dailyRangeStart.getDate() - rangeDays + 1);
  dailyRangeStart.setHours(0, 0, 0, 0);

  const dailyMap = new Map<string, { revenue: number; orderCount: number }>();
  for (const order of ordersInRange) {
    if (order.createdAt < dailyRangeStart) continue;
    const key = toDateKey(order.createdAt);
    const entry = dailyMap.get(key) ?? { revenue: 0, orderCount: 0 };
    entry.revenue += order.totalPrice;
    entry.orderCount += 1;
    dailyMap.set(key, entry);
  }
  const dailyRevenue: DailyRevenuePoint[] = [];
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = toDateKey(d);
    const entry = dailyMap.get(key) ?? { revenue: 0, orderCount: 0 };
    dailyRevenue.push({
      date: key,
      label: DAY_LABEL_FORMATTER.format(d),
      revenue: entry.revenue,
      orderCount: entry.orderCount,
    });
  }

  // === Tren bulanan (12 bulan terakhir) ===
  const monthlyMap = new Map<string, { revenue: number; orderCount: number }>();
  for (const order of ordersInRange) {
    const key = toMonthKey(order.createdAt);
    const entry = monthlyMap.get(key) ?? { revenue: 0, orderCount: 0 };
    entry.revenue += order.totalPrice;
    entry.orderCount += 1;
    monthlyMap.set(key, entry);
  }
  const monthlyRevenue: MonthlyRevenuePoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = toMonthKey(d);
    const entry = monthlyMap.get(key) ?? { revenue: 0, orderCount: 0 };
    monthlyRevenue.push({
      month: key,
      label: MONTH_LABEL_FORMATTER.format(d),
      revenue: entry.revenue,
      orderCount: entry.orderCount,
    });
  }

  // === Breakdown status & game ===
  const STATUS_ORDER = ["MENUNGGU", "DIKERJAKAN", "FINISHING", "SELESAI", "DIBATALKAN"];
  const statusBreakdown: StatusBreakdown[] = STATUS_ORDER.map((status) => ({
    status,
    count: statusCounts.find((s) => s.status === status)?._count._all ?? 0,
  }));

  const gameBreakdown: GameBreakdown[] = gameCounts
    .map((g) => {
      const game = gameById.get(g.gameId);
      return {
        gameId: g.gameId,
        gameName: game?.name ?? "Game tidak dikenal",
        accentColor: game?.accentColor ?? "#8B8B8B",
        orderCount: g._count._all,
        revenue: g._sum.totalPrice ?? 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
    completedOrders,
    activeOrders,
    cancelledOrders,
    dailyRevenue,
    monthlyRevenue,
    statusBreakdown,
    gameBreakdown,
  };
}
