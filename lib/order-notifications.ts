import { buildAutoTasks, startOfDay } from "@/lib/rawat-akun-schedule";
import { prisma } from "@/lib/prisma";

const ACTIVE_STATUSES = ["MENUNGGU", "DIKERJAKAN", "FINISHING"] as const;
const REMINDER_DAYS = 3;

export interface OrderNotification {
    id: string;
    orderId: string;
    orderCode: string;
    href: string;
    title: string;
    detail: string;
    tone: "urgent" | "normal";
}

function daysFromToday(date: Date, today: Date): number {
    return Math.round((startOfDay(date).getTime() - today.getTime()) / 86400000);
}

export async function getOrderNotifications(workerId?: string): Promise<OrderNotification[]> {
    const orders = await prisma.order.findMany({
        where: {
            status: { in: [...ACTIVE_STATUSES] },
            ...(workerId ? { workerId } : {}),
        },
        select: {
            id: true,
            orderCode: true,
            lines: {
                select: {
                    id: true,
                    startDate: true,
                    endDate: true,
                    jokiItem: {
                        select: {
                            title: true,
                            category: { select: { isRawatAkun: true } },
                            includeEvent: true,
                            endgameContent: {
                                select: {
                                    endgameContent: {
                                        select: {
                                            id: true,
                                            title: true,
                                            description: true,
                                            resetCycle: true,
                                            anchorStartDate: true,
                                            daysAfterPatchStart: true,
                                        },
                                    },
                                },
                            },
                            game: {
                                select: {
                                    patches: {
                                        select: {
                                            id: true,
                                            startDate: true,
                                            endDate: true,
                                            events: { select: { id: true, title: true, startDate: true, endDate: true } },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    const today = startOfDay(new Date());
    const horizon = new Date(today);
    horizon.setDate(horizon.getDate() + REMINDER_DAYS);
    const notifications: OrderNotification[] = [];

    for (const order of orders) {
        for (const line of order.lines) {
            const item = line.jokiItem;
            if (!item?.category.isRawatAkun || !line.endDate || !line.startDate) continue;

            const daysLeft = daysFromToday(line.endDate, today);
            if (daysLeft <= REMINDER_DAYS) {
                const detail = daysLeft < 0
                    ? `Terlambat ${Math.abs(daysLeft)} hari dari jadwal selesai.`
                    : daysLeft === 0
                        ? "Berakhir hari ini."
                        : `Berakhir dalam ${daysLeft} hari.`;
                notifications.push({
                    id: `end:${line.id}`,
                    orderId: order.id,
                    orderCode: order.orderCode,
                    href: "",
                    title: item.title,
                    detail,
                    tone: daysLeft <= 1 ? "urgent" : "normal",
                });
            }

            const tasks = buildAutoTasks(
                { startDate: startOfDay(line.startDate), endDate: startOfDay(line.endDate) },
                item.endgameContent.map(({ endgameContent }) => endgameContent),
                item.game.patches,
                item.game.patches.flatMap((patch) => patch.events),
                item.includeEvent
            );
            const upcoming = new Map<string, { category: string; label: string; date: Date }>();
            for (const task of tasks) {
                if (task.date < today || task.date > horizon) continue;
                const key = `${task.category}:${task.label}`;
                if (!upcoming.has(key)) upcoming.set(key, { category: task.category, label: task.label, date: task.date });
            }
            for (const [key, task] of upcoming) {
                const daysUntil = daysFromToday(task.date, today);
                notifications.push({
                    id: `task:${line.id}:${key}`,
                    orderId: order.id,
                    orderCode: order.orderCode,
                    href: "",
                    title: task.label,
                    detail: `${task.category} jatuh ${daysUntil === 0 ? "hari ini" : `dalam ${daysUntil} hari`}.`,
                    tone: daysUntil <= 1 ? "urgent" : "normal",
                });
            }
        }
    }

    return notifications;
}