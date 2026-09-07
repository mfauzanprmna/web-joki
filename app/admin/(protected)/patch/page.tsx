import { prisma } from "@/lib/prisma";
import { CreatePatchForm } from "@/components/admin/CreatePatchForm";
import { PatchRowItem } from "@/components/admin/PatchRowItem";

export default async function AdminPatchPage() {
  const [games, patches] = await Promise.all([
    prisma.game.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.patch.findMany({
      include: { game: true, events: { orderBy: { startDate: "asc" } } },
      orderBy: [{ game: { createdAt: "asc" } }, { startDate: "desc" }],
    }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-1">Patch</h1>
      <p className="text-shihu-muted text-sm mb-6">
        Data patch/update per game beserta event di dalamnya. Event otomatis tampil ke customer (kategori Event) sejak tanggal mulainya tiba, dan hilang begitu tanggal selesainya lewat — tidak perlu diaktifkan/nonaktifkan manual.
      </p>

      <details className="bg-shihu-card border border-shihu-border rounded-2xl p-5 mb-7 group">
        <summary className="font-display text-sm font-semibold cursor-pointer list-none flex items-center justify-between">
          Tambah patch baru
          <span className="text-shihu-corona text-xs group-open:rotate-45 transition-transform">
            +
          </span>
        </summary>

        <CreatePatchForm games={games} />
      </details>

      <div className="flex flex-col gap-3">
        {patches.map((p) => (
          <PatchRowItem key={p.id} patch={p} />
        ))}
      </div>
    </div>
  );
}
