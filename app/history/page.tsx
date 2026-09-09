import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SectionHeading } from "@/components/SectionHeading";
import { HistoryRow } from "@/components/HistoryRow";
import { JokiHistoryPublicRow } from "@/components/JokiHistoryPublicRow";
import type { OrderLineDetail } from "@/components/OrderLineDetailPanel";
import { buildOrderTitle } from "@/lib/order-display";
import { enumerateDays } from "@/lib/rawat-akun-schedule";

export const revalidate = 60;

function buildLineDetails(
  lines: Array<{
    id: string;
    jokiItem: { title: string; category: { isRawatAkun: boolean } | null } | null;
    jokiPaket: { title: string } | null;
    explorationPercent: number | null;
    actFrom: number | null;
    actTo: number | null;
    materialQuantity: number | null;
    rawatAkunQuantity: number | null;
    startDate: Date | null;
    endDate: Date | null;
    updates: {
      id: string;
      note: string | null;
      screenshotUrl: string | null;
      resetLocation: string | null;
      createdAt: Date;
    }[];
    dayProgress: { date: Date; percent: number; note: string | null; screenshotUrls: string[] }[];
    dayTasks: { date: Date; category: string; label: string; status: string }[];
  }>,
): OrderLineDetail[] {
  return lines.map((line) => {
    const isRawatAkun = line.jokiItem?.category?.isRawatAkun ?? false;
    return {
      id: line.id,
      title: line.jokiItem?.title ?? line.jokiPaket?.title ?? "Item tidak dikenal",
      explorationPercent: line.explorationPercent,
      actFrom: line.actFrom,
      actTo: line.actTo,
      materialQuantity: line.materialQuantity,
      rawatAkunQuantity: line.rawatAkunQuantity,
      updates: line.updates.map((u) => ({
        id: u.id,
        note: u.note,
        screenshotUrl: u.screenshotUrl,
        resetLocation: u.resetLocation,
        createdAt: u.createdAt.toISOString(),
      })),
      rawatAkun:
        isRawatAkun && line.startDate && line.endDate
          ? {
              days: enumerateDays(line.startDate, line.endDate).map((d) => {
                const iso = d.toISOString().slice(0, 10);
                const dp = line.dayProgress.find(
                  (p) => p.date.toISOString().slice(0, 10) === iso,
                );
                return {
                  date: iso,
                  percent: dp?.percent ?? 0,
                  note: dp?.note ?? null,
                  screenshotUrls: dp?.screenshotUrls ?? [],
                };
              }),
              tasks: line.dayTasks.map((t) => ({
                date: t.date.toISOString().slice(0, 10),
                category: t.category,
                label: t.label,
                status: t.status as "BELUM" | "SEDANG" | "SELESAI",
              })),
            }
          : null,
    };
  });
}

export default async function HistoryPage() {
  const [orders, manualEntries] = await Promise.all([
    prisma.order.findMany({
      where: { status: "SELESAI" },
      include: {
        game: true,
        customer: true,
        lines: {
          include: {
            jokiItem: { include: { category: { select: { isRawatAkun: true } } } },
            jokiPaket: true,
            updates: { orderBy: { createdAt: "desc" } },
            dayProgress: { orderBy: { date: "asc" } },
            dayTasks: { orderBy: [{ date: "asc" }, { position: "asc" }] },
          },
        },
        testimonial: true,
      },
      orderBy: { completedAt: "desc" },
      take: 50,
    }),
    prisma.jokiHistoryEntry.findMany({
      include: { game: true, customer: { select: { name: true } } },
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
                  lines={buildLineDetails(item.data.lines)}
                />
              ) : (
                <JokiHistoryPublicRow
                  key={`manual-${item.data.id}`}
                  title={item.data.title}
                  customerName={item.data.customer.name}
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
