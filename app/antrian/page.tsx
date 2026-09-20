import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SectionHeading } from "@/components/SectionHeading";
import { AntrianListFilter } from "@/components/AntrianListFilter";
import { buildOrderTitle } from "@/lib/order-display";

export const revalidate = 15;

export default async function AntrianPage() {
  const orders = await prisma.order.findMany({
    where: { status: { in: ["MENUNGGU", "DIKERJAKAN", "FINISHING"] } },
    select: {
      id: true,
      orderCode: true,
      jokerName: true,
      status: true,
      progressPct: true,
      game: true,
      customer: { select: { name: true } },
      // OPTIMASI: dulu `include` penuh (semua kolom jokiItem/jokiPaket/dst)
      // padahal buildOrderTitle di bawah cuma pakai field `title`. Halaman
      // ini di-refresh tiap 15 detik (revalidate) dan menampilkan SEMUA
      // order aktif sekaligus, jadi pemangkasan ini cukup berarti.
      lines: {
        select: {
          jokiItem: { select: { title: true } },
          jokiPaket: { select: { title: true } },
          patchEvent: { select: { title: true } },
          endgameContent: { select: { title: true } },
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });

  const rows = orders.map((o) => ({
    id: o.id,
    orderCode: o.orderCode,
    title: buildOrderTitle(o.lines),
    customerName: o.customer.name,
    jokerName: o.jokerName,
    status: o.status,
    progressPct: o.progressPct,
    game: o.game,
  }));

  return (
    <div className="min-h-screen relative">
      <div className="shihu-glow-top" />
      <Navbar />

      <main className="site-container pb-20 pt-8 relative z-10">
        <SectionHeading
          eyebrow="Real-time"
          title="Antrian joki"
          desc="Progres pengerjaan tiap pesanan yang sedang berjalan, diperbarui langsung oleh joki yang bertugas."
        />

        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          <AntrianListFilter orders={rows} />
        )}
      </main>

      <Footer />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-shihu-card border border-shihu-border rounded-2xl p-10 text-center">
      <p className="font-display font-semibold mb-1.5">Tidak ada antrian saat ini</p>
      <p className="text-shihu-muted text-sm">
        Semua pesanan sudah selesai dikerjakan. Cek halaman history untuk melihat riwayatnya.
      </p>
    </div>
  );
}
