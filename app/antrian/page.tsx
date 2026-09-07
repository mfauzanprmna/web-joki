import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SectionHeading } from "@/components/SectionHeading";
import { QueueRow } from "@/components/QueueRow";
import { buildOrderTitle } from "@/lib/order-display";

export const revalidate = 15;

export default async function AntrianPage() {
  const orders = await prisma.order.findMany({
    where: { status: { in: ["MENUNGGU", "DIKERJAKAN", "FINISHING"] } },
    include: {
      game: true,
      customer: true,
      lines: { include: { jokiItem: true, jokiPaket: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="min-h-screen relative">
      <div className="shihu-glow-top" />
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 pb-20 pt-8 relative z-10">
        <SectionHeading
          eyebrow="Real-time"
          title="Antrian joki"
          desc="Progres pengerjaan tiap pesanan yang sedang berjalan, diperbarui langsung oleh joki yang bertugas."
        />

        {orders.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((o) => (
              <QueueRow
                key={o.id}
                orderCode={o.orderCode}
                title={buildOrderTitle(o.lines)}
                customerName={o.customer.name}
                jokerName={o.jokerName}
                status={o.status}
                progressPct={o.progressPct}
                game={o.game}
              />
            ))}
          </div>
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
