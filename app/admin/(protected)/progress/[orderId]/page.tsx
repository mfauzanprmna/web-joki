import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { OrderProgressTabs } from "@/components/admin/OrderProgressTabs";
import { STATUS_LABEL } from "@/types/game";
import { buildOrderTitle } from "@/lib/order-display";
import { ensureRawatAkunScheduleSynced } from "@/lib/rawat-akun-service";
import { enumerateDays } from "@/lib/rawat-akun-schedule";
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
              category: { select: { isRawatAkun: true } },
              endgameContent: { include: { endgameContent: { select: { resetCycle: true } } } },
            },
          },
          jokiPaket: true,
          updates: { orderBy: { createdAt: "desc" } },
          dayProgress: { orderBy: { date: "asc" } },
          dayTasks: { orderBy: [{ date: "asc" }, { position: "asc" }] },
        },
      },
    },
  });

  if (!order) notFound();

  const lines = order.lines.map((line) => {
    const isRawatAkun = line.jokiItem?.category.isRawatAkun ?? false;
    const characterName =
      "characterName" in line && typeof line.characterName === "string"
        ? line.characterName
        : null;
    return {
      id: line.id,
      title:
        (line.jokiItem?.title ?? line.jokiPaket?.title ?? "Item tidak dikenal") +
        (characterName ? ` — ${characterName}` : ""),
      jokiItem: line.jokiItem
        ? {
          category: line.jokiItem.category,
          endgameContent: line.jokiItem.endgameContent,
        }
        : null,
      updates: line.updates,
      rawatAkun:
        isRawatAkun && line.startDate && line.endDate
          ? {
            days: enumerateDays(line.startDate, line.endDate).map((d) => {
              const iso = d.toISOString().slice(0, 10);
              const dp = line.dayProgress.find((p) => p.date.toISOString().slice(0, 10) === iso);
              return {
                date: iso,
                percent: dp?.percent ?? 0,
                note: dp?.note ?? null,
                screenshotUrls: dp?.screenshotUrls ?? [],
              };
            }),
            tasks: line.dayTasks.map((t) => ({
              id: t.id,
              date: t.date.toISOString().slice(0, 10),
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