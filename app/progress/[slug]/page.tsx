import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SectionHeading } from "@/components/SectionHeading";
import { HistoryRow } from "@/components/HistoryRow";
import {
  CustomerAccountTabs,
  type AccountProgress,
} from "@/components/CustomerAccountTabs";
import { TestimonialPrompt } from "@/components/TestimonialPrompt";
import { buildOrderTitle } from "@/lib/order-display";
import { ensureRawatAkunScheduleSynced } from "@/lib/rawat-akun-service";
import { enumerateDays } from "@/lib/rawat-akun-schedule";

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
    },
  });

  if (!customer) notFound();

  const activeOrders = customer.orders.filter((o) =>
    ["MENUNGGU", "DIKERJAKAN", "FINISHING"].includes(o.status),
  );
  const completedOrders = customer.orders.filter((o) => o.status === "SELESAI");

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
        title:
          line.jokiItem?.title ?? line.jokiPaket?.title ?? "Item tidak dikenal",
        explorationPercent: line.explorationPercent,
        actFrom: line.actFrom,
        actTo: line.actTo,
        materialQuantity: line.materialQuantity,
        rawatAkunQuantity: line.rawatAkunQuantity,
        calculatedPrice: line.calculatedPrice,
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

        <div>
          <p className="font-display text-sm font-semibold text-shihu-muted mb-3">
            History pesanan selesai ({completedOrders.length})
          </p>
          {completedOrders.length === 0 ? (
            <div className="bg-shihu-card border border-shihu-border rounded-2xl p-8 text-center">
              <p className="text-shihu-muted text-sm">
                Belum ada pesanan yang selesai.
              </p>
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
                  <div className="pl-1">
                    <TestimonialPrompt
                      orderId={o.id}
                      defaultCustomerName={customer.name}
                      existing={
                        o.testimonial
                          ? {
                              rating: o.testimonial.rating,
                              message: o.testimonial.message,
                              isPublished: o.testimonial.isPublished,
                            }
                          : null
                      }
                    />
                  </div>
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
