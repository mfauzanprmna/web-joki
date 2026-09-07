import { prisma } from "@/lib/prisma";
import { CreateJokiItemForm } from "@/components/admin/CreateJokiItemForm";
import { JokiItemRowItem } from "@/components/admin/JokiItemRowItem";

export default async function AdminJokiPage() {
  const [games, categories, regions, questTypes, patches, endgameContents, items] = await Promise.all([
    prisma.game.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.jokiCategory.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.gameRegion.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.questType.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.patch.findMany({ orderBy: { startDate: "asc" } }),
    prisma.endgameContent.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.jokiItem.findMany({
      include: {
        game: true,
        category: true,
        region: true,
        questType: true,
        patch: true,
        endgameContent: true,
      },
      orderBy: [{ game: { createdAt: "asc" } }, { createdAt: "asc" }],
    }),
  ]);

  const patchOptions = patches.map((p) => ({
    id: p.id,
    gameId: p.gameId,
    name: p.name,
    startDate: p.startDate.toISOString(),
    endDate: p.endDate.toISOString(),
  }));

  const hasFoundation = categories.length > 0;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-1">Joki item</h1>
      <p className="text-shihu-muted text-sm mb-6">
        Layanan joki yang tampil ke customer. Setiap item terikat ke Game dan Kategori (wajib), serta Region dan/atau Jenis Quest jika kategorinya mewajibkan.
      </p>

      {!hasFoundation && (
        <div className="bg-shihu-corona/10 border border-shihu-corona/40 rounded-2xl p-5 mb-7">
          <p className="font-display text-sm font-semibold text-shihu-corona mb-1">
            Belum ada kategori
          </p>
          <p className="text-shihu-muted text-[13px]">
            Buat minimal satu Kategori joki dulu di halaman{" "}
            <a href="/admin/kategori" className="underline text-shihu-text">
              Kategori joki
            </a>{" "}
            sebelum bisa menambahkan Joki Item.
          </p>
        </div>
      )}

      {hasFoundation && (
        <details className="bg-shihu-card border border-shihu-border rounded-2xl p-5 mb-7 group">
          <summary className="font-display text-sm font-semibold cursor-pointer list-none flex items-center justify-between">
            Tambah joki item baru
            <span className="text-shihu-corona text-xs group-open:rotate-45 transition-transform">
              +
            </span>
          </summary>

          <CreateJokiItemForm
            games={games}
            categories={categories}
            regions={regions}
            questTypes={questTypes}
            patches={patchOptions}
            endgameContents={endgameContents}
          />
        </details>
      )}

      <div className="flex flex-col gap-2.5">
        {items.map((item) => (
          <JokiItemRowItem
            key={item.id}
            item={item}
            games={games}
            categories={categories}
            regions={regions}
            questTypes={questTypes}
            patches={patchOptions}
            endgameContents={endgameContents}
          />
        ))}
      </div>
    </div>
  );
}
