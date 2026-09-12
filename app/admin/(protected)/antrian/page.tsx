import { prisma } from "@/lib/prisma";
import { CreateOrderForm } from "@/components/admin/CreateOrderForm";
import { OrderListFilter } from "@/components/admin/OrderListFilter";
import { isPatchEventLive } from "@/lib/patch-schedule";

export default async function AdminAntrianPage() {
  const [games, items, pakets, events, customers, orders, workers] = await Promise.all([
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
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          select: { orderSource: true, sourceUsername: true },
        },
      },
    }),
    prisma.order.findMany({
      include: {
        game: true,
        customer: true,
        lines: { include: { jokiItem: true, jokiPaket: true, patchEvent: true } },
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

  const customerOptions = customers.map(({ id, name, orders: customerOrders }) => ({
    id,
    name,
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

        <CreateOrderForm games={games} items={itemOptions} pakets={paketOptions} events={eventOptions} customers={customerOptions} />
      </details>

      <OrderListFilter orders={orders} games={games} workers={workers} />
    </div>
  );
}