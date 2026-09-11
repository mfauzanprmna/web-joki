import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SectionHeading } from "@/components/SectionHeading";
import { HistoryRow } from "@/components/HistoryRow";
import { JokiHistoryPublicRow } from "@/components/JokiHistoryPublicRow";
import { PaginatedList } from "@/components/PaginatedList";
import { GameCountBadges } from "@/components/GameCountBadges";
import { buildOrderTitle } from "@/lib/order-display";
import type { OrderLineDetail } from "@/components/OrderLineDetailPanel";
import { enumerateDays } from "@/lib/rawat-akun-schedule";

export const revalidate = 60;

export default async function HistoryPage() {
  const [games, orders, manualEntries] = await Promise.all([
    prisma.game.findMany({ orderBy: { createdAt: "asc" } }),
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
      take: 200,
    }),
    prisma.jokiHistoryEntry.findMany({
      include: { game: true, customer: { select: { name: true } } },
      orderBy: { completedAt: "desc" },
      take: 200,
    }),
  ]);

  type HistoryItem =
    | { kind: "order"; completedAt: Date; gameId: string; data: (typeof orders)[number] }
    | { kind: "manual"; completedAt: Date; gameId: string; data: (typeof manualEntries)[number] };

  const combined: HistoryItem[] = [
    ...orders.map((o): HistoryItem => ({ kind: "order", completedAt: o.completedAt ?? o.updatedAt, gameId: o.gameId, data: o })),
    ...manualEntries.map((e): HistoryItem => ({ kind: "manual", completedAt: e.completedAt, gameId: e.gameId, data: e })),
  ].sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());

  const gameCounts = games.map((g) => ({
    ...g,
    count: combined.filter((item) => item.gameId === g.id).length,
  }));

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
          <>
            <GameCountBadges counts={gameCounts} />
            <PaginatedList
              className="flex flex-col gap-2.5"
              pageSize={12}
              items={combined.map((item) =>
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
            />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function buildLineDetails(
  lines: Array<{
    id: string;
    jokiItem: { title: string; category: { isRawatAkun: boolean } } | null;
    jokiPaket: { title: string } | null;
    explorationPercent: number | null;
    actFrom: number | null;
    actTo: number | null;
    materialQuantity: number | null;
    rawatAkunQuantity: number | null;
    characterName?: string | null;
    levelFrom?: number | null;
    levelTo?: number | null;
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
    const isRawatAkun = line.jokiItem?.category.isRawatAkun ?? false;
    return {
      id: line.id,
      title: line.jokiItem?.title ?? line.jokiPaket?.title ?? "Item tidak dikenal",
      explorationPercent: line.explorationPercent,
      actFrom: line.actFrom,
      actTo: line.actTo,
      materialQuantity: line.materialQuantity,
      rawatAkunQuantity: line.rawatAkunQuantity,
      characterName: line.characterName ?? null,
      levelFrom: line.levelFrom ?? null,
      levelTo: line.levelTo ?? null,
      updates: line.updates.map((update) => ({
        id: update.id,
        note: update.note,
        screenshotUrl: update.screenshotUrl,
        resetLocation: update.resetLocation,
        createdAt: update.createdAt.toISOString(),
      })),
      rawatAkun:
        isRawatAkun && line.startDate && line.endDate
          ? {
            days: enumerateDays(line.startDate, line.endDate).map((date) => {
              const iso = date.toISOString().slice(0, 10);
              const dayProgress = line.dayProgress.find(
                (progress) => progress.date.toISOString().slice(0, 10) === iso,
              );
              return {
                date: iso,
                percent: dayProgress?.percent ?? 0,
                note: dayProgress?.note ?? null,
                screenshotUrls: dayProgress?.screenshotUrls ?? [],
              };
            }),
            tasks: line.dayTasks.map((task) => ({
              date: task.date.toISOString().slice(0, 10),
              category: task.category,
              label: task.label,
              status: task.status as "BELUM" | "SEDANG" | "SELESAI",
            })),
          }
          : null,
    };
  });
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