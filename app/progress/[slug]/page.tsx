import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SectionHeading } from "@/components/SectionHeading";
import { HistoryRow } from "@/components/HistoryRow";
import { JokiHistoryPublicRow } from "@/components/JokiHistoryPublicRow";
import {
  CustomerAccountTabs,
  type AccountProgress,
} from "@/components/CustomerAccountTabs";
import type { OrderLineDetail } from "@/components/OrderLineDetailPanel";
import { TestimonialPrompt } from "@/components/TestimonialPrompt";
import { buildOrderTitle } from "@/lib/order-display";
import { ensureRawatAkunScheduleSynced } from "@/lib/rawat-akun-service";
import { enumerateDays } from "@/lib/rawat-akun-schedule";

export const revalidate = 0;

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

export default async function CustomerProgressPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const customerPreview = await prisma.customer.findUnique({
    where: { publicSlug: slug },
    select: {
      orders: {
        select: {
          lines: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              jokiItem: {
                select: { category: { select: { isRawatAkun: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!customerPreview) notFound();

  await Promise.all(
    customerPreview.orders
      .flatMap((o) => o.lines)
      .filter(
        (l) => l.jokiItem?.category.isRawatAkun && l.startDate && l.endDate,
      )
      .map((l) => ensureRawatAkunScheduleSynced(l.id)),
  );

  const customer = await prisma.customer.findUnique({
    where: { publicSlug: slug },
    include: {
      orders: {
        include: {
          game: true,
          lines: {
            include: {
              jokiItem: {
                include: { category: { select: { isRawatAkun: true } } },
              },
              jokiPaket: true,
              updates: { orderBy: { createdAt: "desc" } },
              dayProgress: { orderBy: { date: "asc" } },
              dayTasks: { orderBy: [{ date: "asc" }, { position: "asc" }] },
            },
          },
          testimonial: true,
        },
        orderBy: { createdAt: "desc" },
      },
      jokiHistoryEntries: {
        include: { game: true },
        orderBy: { completedAt: "desc" },
      },
    },
  });

  if (!customer) notFound();

  const activeOrders = customer.orders.filter((o) =>
    ["MENUNGGU", "DIKERJAKAN", "FINISHING"].includes(o.status),
  );
  const completedOrders = customer.orders.filter((o) => o.status === "SELESAI");
  type CompletedHistoryItem =
    | { kind: "order"; completedAt: Date; data: (typeof completedOrders)[number] }
    | { kind: "manual"; completedAt: Date; data: (typeof customer.jokiHistoryEntries)[number] };
  const completedHistory: CompletedHistoryItem[] = [
    ...completedOrders.map((order): CompletedHistoryItem => ({
      kind: "order",
      completedAt: order.completedAt ?? order.updatedAt,
      data: order,
    })),
    ...customer.jokiHistoryEntries.map((entry): CompletedHistoryItem => ({
      kind: "manual",
      completedAt: entry.completedAt,
      data: entry,
    })),
  ].sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());

  const accounts: AccountProgress[] = activeOrders.map((o) => ({
    orderId: o.id,
    orderCode: o.orderCode,
    gameName: o.game.name,
    gameAccent: o.game.accentColor,
    status: o.status,
    progressPct: o.progressPct,
    jokerName: o.jokerName,
    estimasiJoki: o.estimasiJoki,
    totalPrice: o.totalPrice,
    lines: buildLineDetails(o.lines),
  }));

  return (
    <div className="min-h-screen relative">
      <div className="shihu-glow-top" />
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 pb-20 pt-8 relative z-10">
        <SectionHeading
          eyebrow="Halaman progress"
          title={customer.name}
          desc={`Ringkasan pesanan dan progres pengerjaan untuk ${customer.name}.`}
        />

        <div className="mb-10">
          <p className="font-display text-sm font-semibold text-shihu-muted mb-3">
            Sedang berjalan ({activeOrders.length})
          </p>
          <CustomerAccountTabs accounts={accounts} />
        </div>

        <div>
          <p className="font-display text-sm font-semibold text-shihu-muted mb-3">
            History pesanan selesai ({completedHistory.length})
          </p>
          {completedHistory.length === 0 ? (
            <div className="bg-shihu-card border border-shihu-border rounded-2xl p-8 text-center">
              <p className="text-shihu-muted text-sm">
                Belum ada pesanan yang selesai.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {completedHistory.map((item) =>
                item.kind === "order" ? (
                  <div key={`order-${item.data.id}`} className="flex flex-col gap-2">
                    <HistoryRow
                      orderCode={item.data.orderCode}
                      title={buildOrderTitle(item.data.lines)}
                      customerName={customer.name}
                      completedAt={item.data.completedAt ?? item.data.updatedAt}
                      rating={item.data.testimonial?.rating ?? null}
                      game={item.data.game}
                      lines={buildLineDetails(item.data.lines)}
                    />
                    <div className="pl-1">
                      <TestimonialPrompt
                        orderId={item.data.id}
                        defaultCustomerName={customer.name}
                        existing={
                          item.data.testimonial
                            ? {
                              rating: item.data.testimonial.rating,
                              message: item.data.testimonial.message,
                              isPublished: item.data.testimonial.isPublished,
                            }
                            : null
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <JokiHistoryPublicRow
                    key={`manual-${item.data.id}`}
                    title={item.data.title}
                    customerName={customer.name}
                    completedAt={item.data.completedAt}
                    rating={item.data.rating}
                    note={item.data.note}
                    screenshotUrls={item.data.screenshotUrls}
                    game={item.data.game}
                  />
                ),
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
