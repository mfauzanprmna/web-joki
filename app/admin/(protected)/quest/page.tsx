import { prisma } from "@/lib/prisma";
import { createQuestType } from "@/lib/actions/joki";
import { QuestTypeRowItem } from "@/components/admin/QuestTypeRowItem";

export default async function AdminQuestPage() {
  const [games, questTypes] = await Promise.all([
    prisma.game.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.questType.findMany({
      include: { game: true },
      orderBy: [{ game: { createdAt: "asc" } }, { createdAt: "asc" }],
    }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-1">Jenis quest</h1>
      <p className="text-shihu-muted text-sm mb-6">
        Data jenis quest per game (mis. Archon Quest, World Quest). Nyalakan toggle &ldquo;Spesifik ke region tertentu&rdquo; jika jenis quest ini hanya berlaku di satu region — Joki Item dengan jenis quest tersebut nantinya wajib memilih Region juga.
      </p>

      <details className="bg-shihu-card border border-shihu-border rounded-2xl p-5 mb-7 group">
        <summary className="font-display text-sm font-semibold cursor-pointer list-none flex items-center justify-between">
          Tambah jenis quest baru
          <span className="text-shihu-corona text-xs group-open:rotate-45 transition-transform">
            +
          </span>
        </summary>

        <form action={createQuestType} className="flex flex-col gap-3 mt-4">
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
              Nama jenis quest
            </label>
            <input name="name" required className="admin-input" placeholder="World Quest" />
          </div>

          <div>
            <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
              Jenis
            </label>
            <select name="questKind" defaultValue="LAINNYA" className="admin-input">
              <option value="LAINNYA">Lainnya</option>
              <option value="WORLD">World Quest</option>
              <option value="ARCHON">Archon Quest</option>
            </select>
            <p className="text-[11px] text-shihu-faint mt-1">
              Dipakai untuk menyaring pilihan World Quest / Archon Quest saat menyusun Paket Joki.
            </p>
          </div>

          <label className="flex items-center justify-between gap-2 text-xs text-shihu-text font-display bg-[#241E38] rounded-xl px-3.5 py-3 border border-shihu-border">
            <span>
              Spesifik ke region tertentu
              <span className="block text-[11px] text-shihu-faint font-normal mt-0.5">
                Jika aktif, Joki Item dengan jenis quest ini wajib juga memilih Region
              </span>
            </span>
            <input
              type="checkbox"
              name="isRegionSpecific"
              className="accent-shihu-corona w-4 h-4 shrink-0"
            />
          </label>

          <button
            type="submit"
            className="self-start px-5 py-2.5 rounded-xl font-display font-semibold text-sm text-[#1A1206] bg-corona mt-1"
          >
            Tambah jenis quest
          </button>
        </form>
      </details>

      <div className="flex flex-col gap-2.5">
        {questTypes.map((q) => (
          <QuestTypeRowItem key={q.id} questType={q} />
        ))}
      </div>
    </div>
  );
}
