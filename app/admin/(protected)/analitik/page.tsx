import { getAnalyticsSummary } from "@/lib/analytics";
import { formatRupiah } from "@/lib/format";
import { RevenueChartTabs } from "@/components/admin/RevenueChartTabs";

const STATUS_LABEL: Record<string, string> = {
  MENUNGGU: "Menunggu giliran",
  DIKERJAKAN: "Sedang dikerjakan",
  FINISHING: "Finishing",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
};

const STATUS_COLOR: Record<string, string> = {
  MENUNGGU: "#F5A623",
  DIKERJAKAN: "#4FC3F7",
  FINISHING: "#9575CD",
  SELESAI: "#4CD97D",
  DIBATALKAN: "#E2504A",
};

export default async function AdminAnalyticsPage() {
  const summary = await getAnalyticsSummary(30);

  const maxStatusCount = Math.max(1, ...summary.statusBreakdown.map((s) => s.count));
  const maxGameRevenue = Math.max(1, ...summary.gameBreakdown.map((g) => g.revenue));

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-1">Analitik</h1>
      <p className="text-shihu-muted text-sm mb-7">
        Ringkasan performa penjualan Shihu Service, dari seluruh riwayat order.
      </p>

      {/* Ringkasan angka utama */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
        <div className="bg-shihu-card border border-shihu-border rounded-2xl p-5">
          <p className="font-display text-2xl font-bold text-shihu-corona mb-1">
            {formatRupiah(summary.totalRevenue)}
          </p>
          <p className="text-shihu-muted text-sm">Total omzet</p>
        </div>
        <div className="bg-shihu-card border border-shihu-border rounded-2xl p-5">
          <p className="font-display text-2xl font-bold mb-1">{summary.totalOrders}</p>
          <p className="text-shihu-muted text-sm">Total order</p>
        </div>
        <div className="bg-shihu-card border border-shihu-border rounded-2xl p-5">
          <p className="font-display text-2xl font-bold mb-1">{formatRupiah(summary.averageOrderValue)}</p>
          <p className="text-shihu-muted text-sm">Rata-rata nilai order</p>
        </div>
        <div className="bg-shihu-card border border-shihu-border rounded-2xl p-5">
          <p className="font-display text-2xl font-bold text-emerald-400 mb-1">
            {summary.completedOrders}
          </p>
          <p className="text-shihu-muted text-sm">Order selesai</p>
        </div>
      </div>

      {/* Tren omzet */}
      <div className="bg-shihu-card border border-shihu-border rounded-2xl p-5 mb-8">
        <p className="font-display text-sm font-semibold mb-4">Tren omzet</p>
        <RevenueChartTabs daily={summary.dailyRevenue} monthly={summary.monthlyRevenue} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Breakdown status */}
        <div className="bg-shihu-card border border-shihu-border rounded-2xl p-5">
          <p className="font-display text-sm font-semibold mb-4">Order per status</p>
          <div className="flex flex-col gap-3">
            {summary.statusBreakdown.map((s) => (
              <div key={s.status}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-shihu-muted font-display">
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                  <span className="font-display font-semibold">{s.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-shihu-bg overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width]"
                    style={{
                      width: `${(s.count / maxStatusCount) * 100}%`,
                      backgroundColor: STATUS_COLOR[s.status] ?? "#8B8B8B",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Breakdown per game */}
        <div className="bg-shihu-card border border-shihu-border rounded-2xl p-5">
          <p className="font-display text-sm font-semibold mb-4">Omzet per game</p>
          {summary.gameBreakdown.length === 0 ? (
            <p className="text-shihu-faint text-xs">Belum ada order.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {summary.gameBreakdown.map((g) => (
                <div key={g.gameId}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-shihu-muted font-display">
                      {g.gameName} <span className="text-shihu-faint">· {g.orderCount} order</span>
                    </span>
                    <span className="font-display font-semibold">{formatRupiah(g.revenue)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-shihu-bg overflow-hidden">
                    <div
                      className="h-full rounded-full transition-[width]"
                      style={{
                        width: `${(g.revenue / maxGameRevenue) * 100}%`,
                        backgroundColor: g.accentColor,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
