import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SectionHeading } from "@/components/SectionHeading";
import { HistoryRow } from "@/components/HistoryRow";
import { TestimoniCard } from "@/components/TestimoniCard";
import { CustomerAccountTabs, type AccountProgress } from "@/components/CustomerAccountTabs";
import { TestimonialPrompt } from "@/components/TestimonialPrompt";
import { JokiHistoryTestimonialForm } from "@/components/JokiHistoryTestimonialForm";
import { buildOrderTitle } from "@/lib/order-display";
import { ensureRawatAkunScheduleSynced } from "@/lib/rawat-akun-service";
import { enumerateDays, isoDay } from "@/lib/rawat-akun-schedule";
import { getJokiItemCategoryLabel } from "@/lib/order-progress-grouping";

export const revalidate = 0;

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
            select: { id: true, startDate: true, endDate: true, jokiItem: { select: { category: { select: { isRawatAkun: true } } } } },
          },
        },
      },
    },
  });
  if (!customerPreview) notFound();

  await Promise.all(
    customerPreview.orders
      .flatMap((o) => o.lines)
      .filter((l) => l.jokiItem?.category.isRawatAkun && l.startDate && l.endDate)
      .map((l) => ensureRawatAkunScheduleSynced(l.id))
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
                include: {
                  category: true,
                  region: { select: { name: true } },
                  questType: { select: { name: true, questKind: true } },
                },
              },
              jokiPaket: {
                include: {
                  items: {
                    include: {
                      jokiItem: {
                        select: {
                          id: true,
                          title: true,
                          category: true,
                          region: { select: { name: true } },
                          questType: { select: { name: true, questKind: true } },
                        },
                      },
                    },
                  },
                },
              },
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
        include: { game: true, testimonial: true },
        orderBy: { completedAt: "desc" },
      },
    },
  });

  if (!customer) notFound();

  const activeOrders = customer.orders.filter((o) =>
    ["MENUNGGU", "DIKERJAKAN", "FINISHING"].includes(o.status)
  );
  const completedOrders = customer.orders.filter((o) => o.status === "SELESAI");
  const historyEntries = customer.jokiHistoryEntries;
  const historyCount = completedOrders.length + historyEntries.length;
  const testimonials = [
    ...customer.orders
      .filter((o) => o.testimonial)
      .map((o) => ({
        id: `order-${o.id}`,
        customerName: o.testimonial!.customerName,
        message: o.testimonial!.message,
        rating: o.testimonial!.rating,
        game: o.game,
      })),
    ...historyEntries
      .filter((entry) => entry.testimonial)
      .map((entry) => ({
        id: `history-${entry.id}`,
        customerName: entry.testimonial!.customerName,
        message: entry.testimonial!.message,
        rating: entry.testimonial!.rating,
        game: entry.game,
      })),
  ];

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
    lines: o.lines.map((line) => {
      const isRawatAkun = line.jokiItem?.category.isRawatAkun ?? false;
      return {
        id: line.id,
        jokiPaketId: line.jokiPaketId,
        title:
          (line.jokiItem?.title ?? line.jokiPaket?.title ?? "Item tidak dikenal") +
          (line.characterName ? ` — ${line.characterName}` : ""),
        jokiItem: line.jokiItem
          ? { category: line.jokiItem.category, region: line.jokiItem.region, questType: line.jokiItem.questType }
          : null,
        explorationPercent: line.explorationPercent,
        actFrom: line.actFrom,
        actTo: line.actTo,
        materialQuantity: line.materialQuantity,
        rawatAkunQuantity: line.rawatAkunQuantity,
        characterName: line.characterName,
        levelFrom: line.levelFrom,
        levelTo: line.levelTo,
        progressPercent: line.progressPercent,
        progressCurrent: line.progressCurrent,
        calculatedPrice: line.calculatedPrice,
        updates: line.updates.map((u) => ({
          id: u.id,
          note: u.note,
          screenshotUrl: u.screenshotUrl,
          resetLocation: u.resetLocation,
          createdAt: u.createdAt.toISOString(),
        })),
        paketBreakdown:
          line.jokiPaket?.items.map((it) => ({
            id: it.jokiItem.id,
            title: it.jokiItem.title,
            categoryLabel: getJokiItemCategoryLabel(it.jokiItem),
          })) ?? [],
        paketItems:
          line.jokiPaket?.items.map((it) => ({
            id: it.jokiItem.id,
            title: it.jokiItem.title,
            actFrom: it.actFrom,
            actTo: it.actTo,
            jokiItem: {
              category: it.jokiItem.category,
              region: it.jokiItem.region,
              questType: it.jokiItem.questType,
            },
          })) ?? [],
        rawatAkun:
          isRawatAkun && line.startDate && line.endDate
            ? {
              days: enumerateDays(line.startDate, line.endDate).map((d) => {
                const iso = isoDay(d);
                const dp = line.dayProgress.find((p) => isoDay(p.date) === iso);
                return {
                  date: iso,
                  percent: dp?.percent ?? 0,
                  note: dp?.note ?? null,
                  screenshotUrls: dp?.screenshotUrls ?? [],
                };
              }),
              tasks: line.dayTasks.map((t) => ({
                date: isoDay(t.date),
                category: t.category,
                label: t.label,
                status: t.status,
              })),
            }
            : null,
      };
    }),
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

        <div className="mb-10">
          <p className="font-display text-sm font-semibold text-shihu-muted mb-3">
            Testimoni kamu ({testimonials.length})
          </p>
          {testimonials.length === 0 ? (
            <div className="bg-shihu-card border border-shihu-border rounded-2xl p-6 text-center">
              <p className="text-shihu-muted text-sm">Belum ada testimoni.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {testimonials.map((testimonial) => (
                <TestimoniCard key={testimonial.id} {...testimonial} />
              ))}
            </div>
          )}
        </div>

        {(completedOrders.some((order) => !order.testimonial) || historyEntries.some((entry) => !entry.testimonial)) && (
          <div className="mb-10 bg-shihu-card border border-shihu-border rounded-2xl p-5">
            <p className="font-display text-base font-semibold mb-1">Kasih Testimoni</p>
            <p className="text-sm text-shihu-muted mb-4">
              Pilih history joki yang ingin kamu beri testimoni.
            </p>
            <div className="flex flex-col gap-2.5">
              {completedOrders
                .filter((order) => !order.testimonial)
                .map((order) => (
                  <TestimonialPrompt
                    key={order.id}
                    orderId={order.id}
                    defaultCustomerName={customer.name}
                    title={buildOrderTitle(order.lines)}
                    existing={null}
                    compact
                  />
                ))}
              {historyEntries
                .filter((entry) => !entry.testimonial)
                .map((entry) => (
                  <JokiHistoryTestimonialForm
                    key={entry.id}
                    shareToken={entry.shareToken}
                    defaultCustomerName={customer.name}
                    title={entry.title}
                    existing={null}
                    compact
                  />
                ))}
            </div>
          </div>
        )}

        <div>
          <p className="font-display text-sm font-semibold text-shihu-muted mb-3">
            History pengerjaan ({historyCount})
          </p>
          {historyCount === 0 ? (
            <div className="bg-shihu-card border border-shihu-border rounded-2xl p-8 text-center">
              <p className="text-shihu-muted text-sm">Belum ada history pengerjaan.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {completedOrders.map((o) => (
                <div key={o.id} className="flex flex-col gap-2">
                  <HistoryRow
                    orderCode={o.orderCode}
                    title={buildOrderTitle(o.lines)}
                    customerName={customer.name}
                    completedAt={o.completedAt ?? o.updatedAt}
                    rating={o.testimonial?.rating ?? null}
                    game={o.game}
                  />
                  {o.testimonial && (
                    <div className="pl-1">
                      <TestimonialPrompt
                        orderId={o.id}
                        defaultCustomerName={customer.name}
                        existing={{
                          rating: o.testimonial.rating,
                          message: o.testimonial.message,
                          isPublished: o.testimonial.isPublished,
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
              {historyEntries.map((entry) => (
                <div key={entry.id} className="flex flex-col gap-2">
                  <HistoryRow
                    orderCode="History lama"
                    title={entry.title}
                    customerName={customer.name}
                    completedAt={entry.completedAt}
                    rating={entry.testimonial?.rating ?? entry.rating}
                    game={entry.game}
                  />
                  {entry.testimonial && (
                    <div className="pl-1">
                      <JokiHistoryTestimonialForm
                        shareToken={entry.shareToken}
                        defaultCustomerName={customer.name}
                        existing={{
                          rating: entry.testimonial.rating,
                          message: entry.testimonial.message,
                          isPublished: entry.testimonial.isPublished,
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}