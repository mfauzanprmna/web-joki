import { prisma } from "@/lib/prisma";
import { createGame } from "@/lib/actions/game";
import { GameRowItem } from "@/components/admin/GameRowItem";

const ALL_SLUGS = ["genshin", "wuwa", "neverness"] as const;

export default async function AdminGamePage() {
  const games = await prisma.game.findMany({ orderBy: { createdAt: "asc" } });
  const existingSlugs = new Set(games.map((g) => g.slug));
  const availableSlugs = ALL_SLUGS.filter((s) => !existingSlugs.has(s));

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-1">Game</h1>
      <p className="text-shihu-muted text-sm mb-6">
        Data game yang tersedia di Shihu Service. Ini adalah tabel paling dasar — kategori, region, jenis quest, dan joki item semuanya terikat ke satu game.
      </p>

      {availableSlugs.length > 0 && (
        <details className="bg-shihu-card border border-shihu-border rounded-2xl p-5 mb-7 group">
          <summary className="font-display text-sm font-semibold cursor-pointer list-none flex items-center justify-between">
            Tambah game baru
            <span className="text-shihu-corona text-xs group-open:rotate-45 transition-transform">
              +
            </span>
          </summary>

          <form action={createGame} className="flex flex-col gap-3 mt-4">
            <div>
              <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
                Game
              </label>
              <select name="slug" required className="admin-input">
                {availableSlugs.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
                Nama game
              </label>
              <input name="name" required className="admin-input" placeholder="Genshin Impact" />
            </div>

            <div>
              <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
                Tagline
              </label>
              <input name="tagline" required className="admin-input" placeholder="Open world · Gacha RPG" />
            </div>

            <div>
              <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
                Warna aksen (hex)
              </label>
              <input name="accentColor" required className="admin-input" placeholder="#FFB238" defaultValue="#FFB238" />
            </div>

            <button
              type="submit"
              className="self-start px-5 py-2.5 rounded-xl font-display font-semibold text-sm text-[#1A1206] bg-corona mt-1"
            >
              Tambah game
            </button>
          </form>
        </details>
      )}

      <div className="flex flex-col gap-2.5">
        {games.map((g) => (
          <GameRowItem key={g.id} game={g} />
        ))}
      </div>
    </div>
  );
}
