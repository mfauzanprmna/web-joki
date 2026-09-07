import { prisma } from "@/lib/prisma";
import { CreateOrderForm } from "@/components/admin/CreateOrderForm";
import { OrderRowItem } from "@/components/admin/OrderRowItem";

export default async function AdminAntrianPage() {
  const [games, items, pakets, customers, orders] = await Promise.all([
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
          select: { requiresRegion: true, requiresQuestType: true, isMaterial: true, isRawatAkun: true },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.jokiPaket.findMany({
      where: { isActive: true },
      select: { id: true, gameId: true, title: true, priceRupiah: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.order.findMany({
      include: {
        game: true,
        customer: true,
        lines: { include: { jokiItem: true, jokiPaket: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
  ]);

  const itemOptions = items.map((i) => ({
    ...i,
    patch: i.patch ? { startDate: i.patch.startDate.toISOString(), endDate: i.patch.endDate.toISOString() } : null,
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

        <CreateOrderForm games={games} items={itemOptions} pakets={pakets} customers={customers} />
      </details>

      <div className="flex flex-col gap-2.5">
        {orders.map((o) => (
          <OrderRowItem key={o.id} order={o} />
        ))}
      </div>
    </div>
  );
}
