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

// OPTIMASI: sebelumnya revalidate = 0 (selalu render dinamis penuh dari DB
// setiap kunjungan). Semua Server Action yang mengubah data halaman ini
// SUDAH memanggil revalidatePath(`/progress/${publicSlug}`) (lihat
// lib/actions/order-progress.ts, rawat-akun-progress.ts, line-progress.ts,
// testimonial.ts), jadi perubahan tetap langsung terlihat lewat on-demand
// revalidation -- angka di sini cuma jaring pengaman tambahan (cache
// singkat) untuk kunjungan berulang dalam rentang waktu pendek, bukan
// andalan utama kesegaran data.
export const revalidate = 30;

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
              scheduleSyncedAt: true,
              jokiItem: { select: { category: { select: { isRawatAkun: true } } } },
            },
          },
        },
      },
    },
  });
  if (!customerPreview) notFound();

  // OPTIMASI: cuma jalankan sync (proses berat, lihat catatan di
  // lib/rawat-akun-service.ts) untuk baris yang BELUM pernah disinkronkan.
  // Setelah order berjalan beberapa hari, biasanya array ini kosong, jadi
  // Promise.all langsung selesai tanpa kerja tambahan sama sekali.
  const unsyncedLineIds = customerPreview.orders
    .flatMap((o) => o.lines)
    .filter((l) => l.jokiItem?.category.isRawatAkun && l.startDate && l.endDate && !l.scheduleSyncedAt)
    .map((l) => l.id);

  if (unsyncedLineIds.length > 0) {
    await Promise.all(unsyncedLineIds.map((id) => ensureRawatAkunScheduleSynced(id)));
  }

  const recentCompletedCutoff = new Date();
  recentCompletedCutoff.setDate(recentCompletedCutoff.getDate() - 7);

  // OPTIMASI: dulu SATU query menarik nested lengkap (updates, dayProgress,
  // dayTasks, breakdown paket, dst) untuk SEMUA order milik customer --
  // termasuk order lama yang sudah SELESAI berbulan-bulan lalu, padahal di
  // bagian History bawah cuma judulnya saja yang ditampilkan (lihat
  // buildOrderTitle). Sekarang dipisah: order yang butuh detail penuh
  // (aktif + baru selesai) vs order lama (select minimal untuk History).
  const [customer, oldCompletedOrders] = await Promise.all([
    prisma.customer.findUnique({
      where: { publicSlug: slug },
      include: {
        orders: {
          where: {
            OR: [
              { status: { in: ["MENUNGGU", "DIKERJAKAN", "FINISHING"] } },
              { status: "SELESAI", completedAt: { gte: recentCompletedCutoff } },
              // completedAt bisa null di data lama -- fallback ke updatedAt
              // supaya order yang sebenarnya baru tidak salah kelompok jadi
              // "lama" gara-gara completedAt belum pernah diisi.
              { status: "SELESAI", completedAt: null, updatedAt: { gte: recentCompletedCutoff } },
            ],
          },
          include: {
            game: true,
            account: true,
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
                patchEvent: { select: { title: true } },
                endgameContent: { select: { title: true } },
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
    }),
    // Order SELESAI yang sudah lama -- cuma untuk daftar History ringkas,
    // jadi select seperlunya saja (bukan nested lengkap seperti di atas).
    prisma.order.findMany({
      where: {
        customer: { publicSlug: slug },
        status: "SELESAI",
        NOT: {
          OR: [
            { completedAt: { gte: recentCompletedCutoff } },
            { completedAt: null, updatedAt: { gte: recentCompletedCutoff } },
          ],
        },
      },
      select: {
        id: true,
        orderCode: true,
        completedAt: true,
        updatedAt: true,
        game: true,
        testimonial: true,
        lines: {
          select: {
            jokiItem: { select: { title: true } },
            jokiPaket: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!customer) notFound();

  const activeOrders = customer.orders.filter((o) =>
    ["MENUNGGU", "DIKERJAKAN", "FINISHING"].includes(o.status)
  );
  const recentCompletedOrders = customer.orders.filter((o) => o.status === "SELESAI");

  // Normalisasi eksplisit ke satu shape seragam (cuma field yang benar-benar
  // dipakai render History di bawah) -- recentCompletedOrders datang dari
  // query lengkap, oldCompletedOrders dari query select minimal; keduanya
  // dipetakan ke bentuk yang sama supaya digabung dengan tipe yang jelas,
  // bukan mengandalkan union implisit dari dua shape Prisma yang berbeda.
  interface HistoryOrderSummary {
    id: string;
    orderCode: string;
    completedAt: Date | null;
    updatedAt: Date;
    game: (typeof recentCompletedOrders)[number]["game"];
    testimonial: (typeof recentCompletedOrders)[number]["testimonial"];
    lines: { jokiItem: { title: string } | null; jokiPaket: { title: string } | null }[];
  }
  const toHistorySummary = (o: {
    id: string;
    orderCode: string;
    completedAt: Date | null;
    updatedAt: Date;
    game: HistoryOrderSummary["game"];
    testimonial: HistoryOrderSummary["testimonial"];
    lines: { jokiItem: { title: string } | null; jokiPaket: { title: string } | null }[];
  }): HistoryOrderSummary => ({
    id: o.id,
    orderCode: o.orderCode,
    completedAt: o.completedAt,
    updatedAt: o.updatedAt,
    game: o.game,
    testimonial: o.testimonial,
    lines: o.lines,
  });

  // "completedOrders" dipakai di bagian History bawah: gabungan yang baru
  // selesai (detail penuh dari query utama, tapi cukup diakses field
  // dasarnya) + yang lama (select minimal dari query kedua).
  const completedOrders = [
    ...recentCompletedOrders.map(toHistorySummary),
    ...oldCompletedOrders.map(toHistorySummary),
  ];
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
    // oldCompletedOrders TIDAK termasuk di customer.orders (lihat query
    // terpisah di atas), jadi testimoni dari order lama perlu ditambahkan
    // manual di sini supaya tetap tampil seperti sebelum dipecah.
    ...oldCompletedOrders
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

  const buildAccounts = (orders: typeof activeOrders): AccountProgress[] => {
    const accountGroups = new Map<string, typeof activeOrders>();
    for (const order of orders) {
      const key = order.accountId ?? `order:${order.id}`;
      const group = accountGroups.get(key) ?? [];
      group.push(order);
      accountGroups.set(key, group);
    }

    return Array.from(accountGroups.entries()).map(([accountKey, accountOrders]) => {
      const firstOrder = accountOrders[0];
      return {
        orderId: accountKey,
        accountName: firstOrder.account?.name ?? `Akun ${firstOrder.orderCode}`,
        orderCode: accountOrders.map((order) => order.orderCode).join(" · "),
        gameName: firstOrder.game.name,
        gameAccent: firstOrder.game.accentColor,
        status: accountOrders.some((order) => order.status === "SELESAI")
          ? "SELESAI"
          : accountOrders.some((order) => order.status === "FINISHING")
            ? "FINISHING"
            : accountOrders.some((order) => order.status === "DIKERJAKAN")
              ? "DIKERJAKAN"
              : "MENUNGGU",
        progressPct: Math.round(accountOrders.reduce((sum, order) => sum + order.progressPct, 0) / accountOrders.length),
        jokerName: accountOrders.find((order) => order.jokerName)?.jokerName ?? null,
        estimasiJoki: accountOrders.find((order) => order.estimasiJoki)?.estimasiJoki ?? null,
        totalPrice: accountOrders.reduce((sum, order) => sum + order.totalPrice, 0),
        lines: accountOrders.flatMap((o) => o.lines.map((line) => {
          const isRawatAkun = line.jokiItem?.category.isRawatAkun ?? false;
          return {
            id: line.id,
            jokiPaketId: line.jokiPaketId,
            patchEvent: line.patchEvent,
            endgameContent: line.endgameContent,
            title:
              (line.jokiItem?.title ?? line.jokiPaket?.title ?? line.patchEvent?.title ?? line.endgameContent?.title ?? "Item tidak dikenal") +
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
        })),
      };
    });
  };

  const accounts = buildAccounts(activeOrders);
  const recentCompletedAccounts = buildAccounts(recentCompletedOrders);

  return (
    <div className="min-h-screen relative">
      <div className="shihu-glow-top" />
      <Navbar />

      <main className="site-container pb-20 pt-8 relative z-10">
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

        {recentCompletedAccounts.length > 0 && (
          <div className="mb-10">
            <p className="font-display text-sm font-semibold text-shihu-muted mb-1">
              Orderan baru selesai ({recentCompletedOrders.length})
            </p>
            <p className="text-xs text-shihu-faint mb-3">Pesanan yang selesai dalam 7 hari terakhir.</p>
            <CustomerAccountTabs accounts={recentCompletedAccounts} />
          </div>
        )}

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