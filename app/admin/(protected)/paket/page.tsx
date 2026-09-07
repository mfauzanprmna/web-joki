import { prisma } from "@/lib/prisma";
import { CreateJokiPaketForm } from "@/components/admin/CreateJokiPaketForm";
import { JokiPaketRowItem } from "@/components/admin/JokiPaketRowItem";

export default async function AdminPaketPage() {
  const [games, regions, categories, questTypes, items, pakets] = await Promise.all([
    prisma.game.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.gameRegion.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.jokiCategory.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.questType.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.jokiItem.findMany({
      where: { isActive: true },
      select: { id: true, gameId: true, title: true, priceRupiah: true, categoryId: true, regionId: true, questTypeId: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.jokiPaket.findMany({
      include: {
        game: true,
        region: true,
        items: { include: { jokiItem: { select: { title: true } } } },
      },
      orderBy: [{ game: { createdAt: "asc" } }, { createdAt: "asc" }],
    }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-1">Paket joki</h1>
      <p className="text-shihu-muted text-sm mb-6">
        Kumpulan beberapa Joki Item dijual sebagai satu paket. Harga otomatis terisi dari total harga item yang dipilih, tapi bisa diubah manual. Isi Region untuk menyertakan layanan Eksplorasi/World Quest/Archon Quest region tersebut.
      </p>

      <details className="bg-shihu-card border border-shihu-border rounded-2xl p-5 mb-7 group">
        <summary className="font-display text-sm font-semibold cursor-pointer list-none flex items-center justify-between">
          Tambah paket baru
          <span className="text-shihu-corona text-xs group-open:rotate-45 transition-transform">
            +
          </span>
        </summary>

        <CreateJokiPaketForm games={games} regions={regions} categories={categories} questTypes={questTypes} items={items} />
      </details>

      <div className="flex flex-col gap-2.5">
        {pakets.map((p) => (
          <JokiPaketRowItem
            key={p.id}
            paket={p}
            regions={regions}
            categories={categories}
            questTypes={questTypes}
            items={items}
          />
        ))}
      </div>
    </div>
  );
}
