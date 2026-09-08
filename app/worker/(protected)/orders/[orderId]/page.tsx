import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentWorker } from "@/lib/actions/worker-auth";
import { OrderProgressTabs } from "@/components/admin/OrderProgressTabs";
import { STATUS_LABEL } from "@/types/game";
import { formatRupiah } from "@/lib/format";
import { buildOrderTitle } from "@/lib/order-display";
import { calculateWorkerCommission } from "@/lib/commission";
import { ensureRawatAkunScheduleSynced } from "@/lib/rawat-akun-service";
import { enumerateDays } from "@/lib/rawat-akun-schedule";

export default async function WorkerOrderProgressPage({
    params,
}: {
    params: Promise<{ orderId: string }>;
}) {
    const worker = await getCurrentWorker();
    if (!worker) redirect("/worker/login");

    const { orderId } = await params;

    const orderPreview = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
            workerId: true,
            lines: {
                select: { id: true, startDate: true, endDate: true, jokiItem: { select: { category: { select: { isRawatAkun: true } } } } },
            },
        },
    });

    // Cuma pemilik order (workerId cocok) yang boleh lihat/update -- order milik
    // worker lain dianggap tidak ada (notFound), bukan "forbidden", supaya tidak
    // bocor informasi keberadaan order tsb.
    if (!orderPreview || orderPreview.workerId !== worker.id) notFound();

    await Promise.all(
        orderPreview.lines
            .filter((l) => l.jokiItem?.category.isRawatAkun && l.startDate && l.endDate)
            .map((l) => ensureRawatAkunScheduleSynced(l.id))
    );

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            game: true,
            customer: { select: { name: true } },
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

    const commission = calculateWorkerCommission(order.totalPrice);

    const lines = order.lines.map((line) => {
        const isRawatAkun = line.jokiItem?.category.isRawatAkun ?? false;
        return {
            id: line.id,
            title: line.jokiItem?.title ?? line.jokiPaket?.title ?? "Item tidak dikenal",
            jokiItem: line.jokiItem
                ? { category: line.jokiItem.category, endgameContent: line.jokiItem.endgameContent }
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
            <Link href="/worker" className="text-shihu-faint text-xs hover:text-shihu-muted">
                ← Daftar pesanan
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

            <div className="bg-shihu-corona/10 border border-shihu-corona/30 rounded-2xl p-4 mb-6 flex items-center justify-between flex-wrap gap-2">
                <p className="text-shihu-corona text-xs font-display font-medium">
                    Update progres di sini langsung terlihat oleh customer dan admin.
                </p>
                <p className="text-shihu-corona text-sm font-display font-bold">Komisi kamu: {formatRupiah(commission)}</p>
            </div>

            <div className="bg-shihu-card border border-shihu-border rounded-2xl p-5">
                <p className="font-display text-sm font-semibold mb-3">Update progres per item</p>
                <OrderProgressTabs lines={lines} />
            </div>
        </div>
    );
}