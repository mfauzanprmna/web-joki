import { prisma } from "@/lib/prisma";
import { createGameRegion } from "@/lib/actions/joki";
import { GameRegionRowItem } from "@/components/admin/GameRegionRowItem";

export default async function AdminRegionPage() {
  const [games, regions] = await Promise.all([
    prisma.game.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.gameRegion.findMany({
      include: { game: true },
      orderBy: [{ game: { createdAt: "asc" } }, { createdAt: "asc" }],
    }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-1">Region</h1>
      <p className="text-shihu-muted text-sm mb-6">
        Data wilayah/region per game (mis. Mondstadt, Liyue). Dipakai saat membuat Joki Item untuk kategori Eksplorasi, atau Quest yang jenis questnya spesifik region.
      </p>

      <details className="bg-shihu-card border border-shihu-border rounded-2xl p-5 mb-7 group">
        <summary className="font-display text-sm font-semibold cursor-pointer list-none flex items-center justify-between">
          Tambah region baru
          <span className="text-shihu-corona text-xs group-open:rotate-45 transition-transform">
            +
          </span>
        </summary>

        <form action={createGameRegion} className="flex flex-col gap-3 mt-4">
          <div>
            <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
              Game
            </label>
            <select name="gameId" required className="admin-input">
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
              Nama region
            </label>
            <input name="name" required className="admin-input" placeholder="Mondstadt" />
          </div>

          <button
            type="submit"
            className="self-start px-5 py-2.5 rounded-xl font-display font-semibold text-sm text-[#1A1206] bg-corona mt-1"
          >
            Tambah region
          </button>
        </form>
      </details>

      <div className="flex flex-col gap-2.5">
        {regions.map((r) => (
          <GameRegionRowItem key={r.id} region={r} />
        ))}
      </div>
    </div>
  );
}
