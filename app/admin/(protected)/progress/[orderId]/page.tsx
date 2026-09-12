import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { OrderProgressTabs, type OrderLineData } from "@/components/admin/OrderProgressTabs";
import { STATUS_LABEL } from "@/types/game";
import { buildOrderTitle } from "@/lib/order-display";
import { ensureRawatAkunScheduleSynced } from "@/lib/rawat-akun-service";
import { enumerateDays, isoDay } from "@/lib/rawat-akun-schedule";
import { getJokiItemCategoryLabel } from "@/lib/order-progress-grouping";
import { CopyLinkBox } from "@/components/admin/CopyLinkBox";

export default async function AdminOrderProgressPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  const orderPreview = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      lines: {
        select: { id: true, startDate: true, endDate: true, jokiItem: { select: { category: { select: { isRawatAkun: true } } } } },
      },
    },
  });
  if (!orderPreview) notFound();

  // Sinkronkan kalender & task otomatis untuk setiap baris Rawat Akun sebelum dibaca.
  await Promise.all(
    orderPreview.lines
      .filter((l) => l.jokiItem?.category.isRawatAkun && l.startDate && l.endDate)
      .map((l) => ensureRawatAkunScheduleSynced(l.id))
  );

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      game: true,
      customer: true,
      worker: { select: { name: true } },
      lines: {
        include: {
          jokiItem: {
            include: {
              category: true,
              region: { select: { name: true } },
              questType: { select: { name: true, questKind: true } },
              endgameContent: { include: { endgameContent: { select: { resetCycle: true } } } },
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
    },
  });

  if (!order) notFound();

  const lines: OrderLineData[] = order.lines.map((line) => {
    const isRawatAkun = line.jokiItem?.category.isRawatAkun ?? false;
    return {
      id: line.id,
      jokiPaketId: line.jokiPaketId,
      title:
        (line.jokiItem?.title ?? line.jokiPaket?.title ?? "Item tidak dikenal") +
        (line.characterName ? ` — ${line.characterName}` : ""),
      jokiItem: line.jokiItem
        ? {
          category: line.jokiItem.category,
          region: line.jokiItem.region,
          questType: line.jokiItem.questType,
          endgameContent: line.jokiItem.endgameContent,
        }
        : null,
      actFrom: line.actFrom,
      actTo: line.actTo,
      materialQuantity: line.materialQuantity,
      progressPercent: line.progressPercent,
      progressCurrent: line.progressCurrent,
      updates: line.updates,
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
            endgameContent: [],
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
              id: t.id,
              date: isoDay(t.date),
              category: t.category,
              label: t.label,
              status: t.status,
              note: t.note,
            })),
          }
          : null,
    };
  });

  return (
    <div>
      <Link href="/admin/antrian" className="text-shihu-faint text-xs hover:text-shihu-muted">
        ← Kembali ke daftar pesanan
      </Link>

      <div className="flex items-center gap-3 flex-wrap mt-3 mb-1">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: order.game.accentColor }} />
        <h1 className="font-display text-2xl font-bold">{order.orderCode}</h1>
        <span className="text-[11px] px-2 py-0.5 rounded bg-[#2C2540] text-shihu-muted font-display">
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>
      <p className="text-shihu-muted text-sm mb-6">
        {order.customer.name} · {order.game.name} · {buildOrderTitle(order.lines)}
      </p>

      <div className="bg-shihu-card border border-shihu-border rounded-2xl p-5 mb-6">
        <p className="font-display text-sm font-semibold mb-3">Update progres per item</p>
        <OrderProgressTabs lines={lines} />
      </div>

      <div className="bg-shihu-card border border-shihu-border rounded-2xl p-4 flex flex-col gap-2.5">
        <CopyLinkBox label="Link progress customer" path={`/progress/${order.customer.publicSlug}`} />
        <p className="text-shihu-faint text-xs">
          Worker yang ditugaskan:{" "}
          <span className="text-shihu-corona font-display">{order.worker?.name ?? "Belum ditugaskan"}</span>
          {" — "}worker login sendiri di{" "}
          <span className="text-shihu-corona font-display">/worker/login</span> untuk update progres ini.
        </p>
      </div>
    </div>
  );
}