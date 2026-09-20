import { prisma } from "@/lib/prisma";
import { CreateOrderForm } from "@/components/admin/CreateOrderForm";
import { OrderListFilter } from "@/components/admin/OrderListFilter";
import { isPatchEventLive } from "@/lib/patch-schedule";

export default async function AdminAntrianPage() {
  const [games, items, pakets, events, endgameContents, customers, accounts, orders, workers] = await Promise.all([
    prisma.game.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.jokiItem.findMany({
      where: { isActive: true },
      select: {
        id: true,
        gameId: true,
        title: true,
        priceRupiah: true,
        unitQuantity: true,
        actNumber: true,
        isPatchWide: true,
        durationDays: true,
        patch: { select: { startDate: true, endDate: true } },
        category: {
          select: {
            requiresRegion: true,
            requiresQuestType: true,
            isMaterial: true,
            isRawatAkun: true,
            requiresCharacterLevel: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.jokiPaket.findMany({
      where: { isActive: true },
      select: { id: true, gameId: true, title: true, priceRupiah: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.patchEvent.findMany({
      where: { startDate: { lte: new Date() }, endDate: { gte: new Date() } },
      include: { patch: { select: { gameId: true, name: true } } },
      orderBy: { startDate: "asc" },
    }),
    prisma.endgameContent.findMany({
      where: { isActive: true, isOrderable: true },
      select: { id: true, gameId: true, title: true, priceRupiah: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      include: {
        // OPTIMASI: dulu tanpa `take`, jadi menarik SEMUA order tiap
        // customer (bisa jadi ribuan baris gabungan untuk toko yang sudah
        // lama jalan), padahal cuma dipakai untuk autofill
        // sourceUsername per platform (lihat customerOptions di bawah) --
        // beberapa order terbaru per customer sudah lebih dari cukup untuk
        // menangkap variasi source yang pernah dipakai.
        orders: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: { orderSource: true, sourceUsername: true },
        },
      },
    }),
    prisma.jokiAccount.findMany({
      select: { id: true, customerId: true, gameId: true, name: true, uid: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.findMany({
      include: {
        game: true,
        customer: true,
        lines: { include: { jokiItem: true, jokiPaket: true, patchEvent: true, endgameContent: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    prisma.worker.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const itemOptions = items.map((i) => ({
    ...i,
    patch: i.patch ? { startDate: i.patch.startDate.toISOString(), endDate: i.patch.endDate.toISOString() } : null,
  }));
  const paketOptions = pakets;
  const eventOptions = events
    .filter((event) => isPatchEventLive(event))
    .map((event) => ({
      id: event.id,
      gameId: event.patch.gameId,
      title: event.title,
      priceRupiah: event.priceRupiah,
      patchName: event.patch.name,
      endDate: event.endDate.toISOString(),
    }));

  // OPTIMASI: sebelumnya `accounts.filter(...)` dijalankan ULANG di dalam
  // .map() customers (kompleksitas O(customers x accounts)). Di-groupBy
  // sekali di sini jadi O(accounts), lookup per customer jadi O(1).
  const accountsByCustomerId = new Map<string, typeof accounts>();
  for (const account of accounts) {
    const list = accountsByCustomerId.get(account.customerId) ?? [];
    list.push(account);
    accountsByCustomerId.set(account.customerId, list);
  }

  const customerOptions = customers.map(({ id, name, orders: customerOrders }) => ({
    id,
    name,
    accounts: (accountsByCustomerId.get(id) ?? []).map(({ id: accountId, gameId, name: accountName, uid }) => ({
      id: accountId,
      gameId,
      name: accountName,
      uid,
    })),
    sourceUsernames: customerOrders.reduce<Partial<Record<"DISCORD" | "INSTAGRAM" | "TIKTOK" | "WHATSAPP", string>>>(
      (usernames, order) => {
        if (!usernames[order.orderSource]) usernames[order.orderSource] = order.sourceUsername;
        return usernames;
      },
      {}
    ),
  }));

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-1">Kelola pesanan</h1>
      <p className="text-shihu-muted text-sm mb-6">
        Buat pesanan baru (bisa pilih beberapa Joki Item/Paket sekaligus), perbarui progres, atau tandai selesai. Status &ldquo;Selesai&rdquo; otomatis masuk ke halaman history.
      </p>

      <details className="bg-shihu-card border border-shihu-border rounded-2xl p-5 mb-7 group">
        <summary className="font-display text-sm font-semibold cursor-pointer list-none flex items-center justify-between">
          Buat pesanan baru
          <span className="text-shihu-corona text-xs group-open:rotate-45 transition-transform">
            +
          </span>
        </summary>

        <CreateOrderForm games={games} items={itemOptions} pakets={paketOptions} events={eventOptions} endgameContents={endgameContents} customers={customerOptions} />
      </details>

      <OrderListFilter orders={orders} games={games} workers={workers} />
    </div>
  );
}