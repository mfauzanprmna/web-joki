import { prisma } from "@/lib/prisma";
import { CreateEndgameContentForm } from "@/components/admin/CreateEndgameContentForm";
import { EndgameContentRowItem } from "@/components/admin/EndgameContentRowItem";
import { PaginatedList } from "@/components/PaginatedList";

export default async function AdminEndgamePage() {
  const [games, contents] = await Promise.all([
    prisma.game.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.endgameContent.findMany({
      include: { game: true },
      orderBy: [{ game: { createdAt: "asc" } }, { createdAt: "asc" }],
    }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-1">Konten endgame</h1>
      <p className="text-shihu-muted text-sm mb-6">
        Konten yang dikerjakan berulang sesuai siklus reset (mingguan, bulanan, atau mengikuti patch). Dipakai sebagai pilihan cakupan pada Joki Item kategori Rawat Akun.
      </p>

      <details className="bg-shihu-card border border-shihu-border rounded-2xl p-5 mb-7 group">
        <summary className="font-display text-sm font-semibold cursor-pointer list-none flex items-center justify-between">
          Tambah konten endgame baru
          <span className="text-shihu-corona text-xs group-open:rotate-45 transition-transform">
            +
          </span>
        </summary>

        <CreateEndgameContentForm games={games} />
      </details>

      <PaginatedList pageSize={15} className="flex flex-col gap-2.5" items={contents.map((c) => <EndgameContentRowItem key={c.id} content={c} />)} />
    </div>
  );
}
