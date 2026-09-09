import { prisma } from "@/lib/prisma";
import { CreateJokiHistoryForm } from "@/components/admin/CreateJokiHistoryForm";
import { JokiHistoryRowItem } from "@/components/admin/JokiHistoryRowItem";

export default async function AdminJokiHistoryPage() {
  const [games, customers, entries] = await Promise.all([
    prisma.game.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.jokiHistoryEntry.findMany({
      include: { game: true, customer: { select: { name: true } }, testimonial: { select: { id: true } } },
      orderBy: { completedAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-1">History joki</h1>
      <p className="text-shihu-muted text-sm mb-6">
        Catat pengerjaan joki yang tidak lewat alur Pesanan biasa (mis. transaksi lama/di luar sistem)
        supaya tetap tampil di halaman History publik, lengkap dengan screenshot bukti pengerjaan. Setiap
        entri dapat link testimoni sendiri yang bisa disalin & dikirim ke customer-nya.
      </p>

      <details className="bg-shihu-card border border-shihu-border rounded-2xl p-5 mb-7 group" open={entries.length === 0}>
        <summary className="font-display text-sm font-semibold cursor-pointer list-none flex items-center justify-between">
          Tambah history joki
          <span className="text-shihu-corona text-xs group-open:rotate-45 transition-transform">
            +
          </span>
        </summary>

        <CreateJokiHistoryForm games={games} customers={customers} />
      </details>

      {entries.length === 0 ? (
        <div className="bg-shihu-card border border-shihu-border rounded-2xl p-10 text-center">
          <p className="font-display font-semibold mb-1.5">Belum ada history joki manual</p>
          <p className="text-shihu-muted text-sm">Tambahkan lewat form di atas.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {entries.map((e) => (
            <JokiHistoryRowItem key={e.id} item={{ ...e, hasTestimonial: Boolean(e.testimonial) }} />
          ))}
        </div>
      )}
    </div>
  );
}