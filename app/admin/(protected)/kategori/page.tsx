import { prisma } from "@/lib/prisma";
import { createJokiCategory } from "@/lib/actions/joki";
import { JokiCategoryRowItem } from "@/components/admin/JokiCategoryRowItem";

export default async function AdminKategoriPage() {
  const [games, categories] = await Promise.all([
    prisma.game.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.jokiCategory.findMany({
      include: { game: true },
      orderBy: [{ game: { createdAt: "asc" } }, { createdAt: "asc" }],
    }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-1">Kategori joki</h1>
      <p className="text-shihu-muted text-sm mb-6">
        Kategori per game (mis. Push Rank, Eksplorasi, Quest). Nyalakan toggle jika kategori ini butuh Region dan/atau Jenis Quest saat dipakai membuat Joki Item.
      </p>

      <details className="bg-shihu-card border border-shihu-border rounded-2xl p-5 mb-7 group">
        <summary className="font-display text-sm font-semibold cursor-pointer list-none flex items-center justify-between">
          Tambah kategori baru
          <span className="text-shihu-corona text-xs group-open:rotate-45 transition-transform">
            +
          </span>
        </summary>

        <form action={createJokiCategory} className="flex flex-col gap-3 mt-4">
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
              Nama kategori
            </label>
            <input name="name" required className="admin-input" placeholder="Eksplorasi" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex items-center justify-between gap-2 text-xs text-shihu-text font-display bg-[#241E38] rounded-xl px-3.5 py-3 border border-shihu-border">
              <span>
                Wajib pilih Region
                <span className="block text-[11px] text-shihu-faint font-normal mt-0.5">
                  Aktifkan jika kategori ini selalu terikat ke region tertentu
                </span>
              </span>
              <input
                type="checkbox"
                name="requiresRegion"
                className="accent-shihu-corona w-4 h-4 shrink-0"
              />
            </label>

            <label className="flex items-center justify-between gap-2 text-xs text-shihu-text font-display bg-[#241E38] rounded-xl px-3.5 py-3 border border-shihu-border">
              <span>
                Wajib pilih Jenis Quest
                <span className="block text-[11px] text-shihu-faint font-normal mt-0.5">
                  Aktifkan jika kategori ini selalu terikat ke jenis quest tertentu
                </span>
              </span>
              <input
                type="checkbox"
                name="requiresQuestType"
                className="accent-shihu-corona w-4 h-4 shrink-0"
              />
            </label>

            <label className="flex items-center justify-between gap-2 text-xs text-shihu-text font-display bg-[#241E38] rounded-xl px-3.5 py-3 border border-shihu-border">
              <span>
                Kategori Rawat Akun
                <span className="block text-[11px] text-shihu-faint font-normal mt-0.5">
                  Aktifkan untuk kategori rawat akun — memunculkan opsi include event & pilihan konten endgame di form Joki Item
                </span>
              </span>
              <input
                type="checkbox"
                name="isRawatAkun"
                className="accent-shihu-corona w-4 h-4 shrink-0"
              />
            </label>

            <label className="flex items-center justify-between gap-2 text-xs text-shihu-text font-display bg-[#241E38] rounded-xl px-3.5 py-3 border border-shihu-border">
              <span>
                Kategori Material
                <span className="block text-[11px] text-shihu-faint font-normal mt-0.5">
                  Aktifkan jika kategori ini menjual material dengan harga per jumlah (mis. Rp 10.000 / 100 material)
                </span>
              </span>
              <input
                type="checkbox"
                name="isMaterial"
                className="accent-shihu-corona w-4 h-4 shrink-0"
              />
            </label>
            <label className="flex items-center justify-between gap-2 text-xs text-shihu-text font-display bg-[#241E38] rounded-xl px-3.5 py-3 border border-shihu-border">
              <span>
                Kategori Build Karakter
                <span className="block text-[11px] text-shihu-faint font-normal mt-0.5">
                  Aktifkan untuk build ascend/talent karakter — memunculkan input nama karakter + rentang level saat order. Harga Joki Item dianggap harga per level.
                </span>
              </span>
              <input
                type="checkbox"
                name="requiresCharacterLevel"
                className="accent-shihu-corona w-4 h-4 shrink-0"
              />
            </label>
          </div>

          <button
            type="submit"
            className="self-start px-5 py-2.5 rounded-xl font-display font-semibold text-sm text-[#1A1206] bg-corona mt-1"
          >
            Tambah kategori
          </button>
        </form>
      </details>

      <div className="flex flex-col gap-2.5">
        {categories.map((c) => (
          <JokiCategoryRowItem key={c.id} category={c} />
        ))}
      </div>
    </div>
  );
}
