import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SectionHeading } from "@/components/SectionHeading";
import { HistoryRow } from "@/components/HistoryRow";
import { JokiHistoryPublicRow } from "@/components/JokiHistoryPublicRow";
import { buildOrderTitle } from "@/lib/order-display";

export const revalidate = 60;

export default async function HistoryPage() {
  const [orders, manualEntries] = await Promise.all([
    prisma.order.findMany({
      where: { status: "SELESAI" },
      include: {
        game: true,
        customer: true,
        lines: { include: { jokiItem: true, jokiPaket: true } },
        testimonial: true,
      },
      orderBy: { completedAt: "desc" },
      take: 50,
    }),
    prisma.jokiHistoryEntry.findMany({
      include: { game: true },
      orderBy: { completedAt: "desc" },
      take: 50,
    }),
  ]);

  type HistoryItem =
    | { kind: "order"; completedAt: Date; data: (typeof orders)[number] }
    | { kind: "manual"; completedAt: Date; data: (typeof manualEntries)[number] };

  const combined: HistoryItem[] = [
    ...orders.map((o): HistoryItem => ({ kind: "order", completedAt: o.completedAt ?? o.updatedAt, data: o })),
    ...manualEntries.map((e): HistoryItem => ({ kind: "manual", completedAt: e.completedAt, data: e })),
  ].sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());

  return (
    <div className="min-h-screen relative">
      <div className="shihu-glow-top" />
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 pb-20 pt-8 relative z-10">
        <SectionHeading
          eyebrow="Selesai"
          title="History joki"
          desc="Daftar pesanan yang sudah rampung dikerjakan dan diserahkan kembali ke customer."
        />

        {combined.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-2.5">
            {combined.map((item) =>
              item.kind === "order" ? (
                <HistoryRow
                  key={`order-${item.data.id}`}
                  orderCode={item.data.orderCode}
                  title={buildOrderTitle(item.data.lines)}
                  customerName={item.data.customer.name}
                  completedAt={item.data.completedAt ?? item.data.updatedAt}
                  rating={item.data.testimonial?.rating ?? null}
                  game={item.data.game}
                />
              ) : (
                <JokiHistoryPublicRow
                  key={`manual-${item.data.id}`}
                  title={item.data.title}
                  customerName={item.data.customerName}
                  completedAt={item.data.completedAt}
                  rating={item.data.rating}
                  note={item.data.note}
                  screenshotUrls={item.data.screenshotUrls}
                  game={item.data.game}
                />
              )
            )}
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
      <p className="font-display font-semibold mb-1.5">Belum ada riwayat joki</p>
      <p className="text-shihu-muted text-sm">
        Pesanan yang sudah selesai dikerjakan akan muncul di sini.
      </p>
    </div>
  );
}
