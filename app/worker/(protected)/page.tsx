import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentWorker } from "@/lib/actions/worker-auth";
import { STATUS_LABEL } from "@/types/game";
import { formatRupiah } from "@/lib/format";
import { buildOrderTitle } from "@/lib/order-display";
import {
    calculateWorkerCommission,
    WORKER_COMMISSION_RATE,
} from "@/lib/commission";

export default async function WorkerDashboardPage() {
    const worker = await getCurrentWorker();
    if (!worker) redirect("/worker/login");

    const orders = await prisma.order.findMany({
        where: { workerId: worker.id },
        include: {
            game: true,
            customer: { select: { name: true } },
            lines: { include: { jokiItem: true, jokiPaket: true } },
        },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    const activeOrders = orders.filter(
        (o) => o.status !== "SELESAI" && o.status !== "DIBATALKAN",
    );
    const doneOrders = orders.filter((o) => o.status === "SELESAI");

    const totalCommissionDone = doneOrders.reduce(
        (sum, o) => sum + calculateWorkerCommission(o.totalPrice),
        0,
    );
    const totalCommissionActive = activeOrders.reduce(
        (sum, o) => sum + calculateWorkerCommission(o.totalPrice),
        0,
    );

    return (
        <div>
            <h1 className="font-display text-2xl font-bold mb-1">
                Halo, {worker.name}
            </h1>
            <p className="text-shihu-muted text-sm mb-6">
                Pesanan yang ditugaskan ke kamu. Komisi dihitung{" "}
                {Math.round(WORKER_COMMISSION_RATE * 100)}% dari harga tiap pesanan.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-7">
                <div className="bg-shihu-card border border-shihu-border rounded-2xl p-4">
                    <p className="text-shihu-faint text-[11px] mb-1">
                        Estimasi komisi berjalan
                    </p>
                    <p className="font-display text-lg font-bold text-shihu-corona">
                        {formatRupiah(totalCommissionActive)}
                    </p>
                    <p className="text-shihu-faint text-[10.5px] mt-0.5">
                        {activeOrders.length} pesanan aktif
                    </p>
                </div>
                <div className="bg-shihu-card border border-shihu-border rounded-2xl p-4">
                    <p className="text-shihu-faint text-[11px] mb-1">
                        Total komisi selesai
                    </p>
                    <p className="font-display text-lg font-bold text-emerald-400">
                        {formatRupiah(totalCommissionDone)}
                    </p>
                    <p className="text-shihu-faint text-[10.5px] mt-0.5">
                        {doneOrders.length} pesanan selesai
                    </p>
                </div>
            </div>

            <p className="font-display text-sm font-semibold text-shihu-muted mb-3">
                Sedang dikerjakan ({activeOrders.length})
            </p>
            {activeOrders.length === 0 ? (
                <div className="bg-shihu-card border border-shihu-border rounded-2xl p-6 text-center mb-8">
                    <p className="text-shihu-muted text-sm">
                        Belum ada pesanan aktif yang ditugaskan ke kamu.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-2.5 mb-8">
                    {activeOrders.map((o) => (
                        <OrderCard key={o.id} order={o} />
                    ))}
                </div>
            )}

            {doneOrders.length > 0 && (
                <>
                    <p className="font-display text-sm font-semibold text-shihu-muted mb-3">
                        Selesai ({doneOrders.length})
                    </p>
                    <div className="flex flex-col gap-2.5">
                        {doneOrders.map((o) => (
                            <OrderCard key={o.id} order={o} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function OrderCard({
    order,
}: {
    order: {
        id: string;
        orderCode: string;
        status: string;
        progressPct: number;
        totalPrice: number;
        estimasiJoki: string | null;
        game: { name: string; accentColor: string };
        customer: { name: string };
        lines: {
            jokiItem: { title: string } | null;
            jokiPaket: { title: string } | null;
        }[];
    };
}) {
    const commission = calculateWorkerCommission(order.totalPrice);

    return (
        <Link
            href={`/worker/orders/${order.id}`}
            className="bg-shihu-card border border-shihu-border rounded-2xl p-4 flex items-center gap-4 flex-wrap hover:border-shihu-corona/40 transition-colors"
        >
            <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: order.game.accentColor }}
            />
            <div className="flex-1 min-w-[180px]">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-shihu-faint font-display">
                        {order.orderCode}
                    </span>
                    <p className="font-display text-sm font-semibold">
                        {buildOrderTitle(order.lines)}
                    </p>
                </div>
                <p className="text-shihu-muted text-xs mt-0.5">
                    {order.customer.name} · {order.game.name} ·{" "}
                    {STATUS_LABEL[order.status] ?? order.status} ({order.progressPct}%)
                    {order.estimasiJoki && ` · Estimasi: ${order.estimasiJoki}`}
                </p>
            </div>
            <div className="text-right">
                <p className="font-display font-bold text-shihu-corona text-sm whitespace-nowrap">
                    {formatRupiah(commission)}
                </p>
                <p className="text-[10px] text-shihu-faint whitespace-nowrap">
                    komisi kamu
                </p>
            </div>
        </Link>
    );
}
