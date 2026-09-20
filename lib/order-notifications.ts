import { buildAutoTasks, startOfDay } from "@/lib/rawat-akun-schedule";
import { prisma } from "@/lib/prisma";

const ACTIVE_STATUSES = ["MENUNGGU", "DIKERJAKAN", "FINISHING"] as const;
// Window pengingat: notifikasi muncul kalau konten akan reset / event akan
// selesai / order akan berakhir dalam <= 2 hari dari sekarang (termasuk hari
// ini, "H-2" s.d. "H").
const REMINDER_DAYS = 2;

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

/**
 * Susun kalimat pengingat sesuai kategori & selisih hari, gaya "2 hari lagi
 * mau reset" / "2 hari lagi event ini akan selesai" -- persis pola yang
 * dipakai admin sehari-hari, bukan frasa generik "jatuh dalam N hari".
 */
function formatReminderDetail(category: string, daysUntil: number): string {
    const isEvent = category === "Event";
    const action = isEvent ? "akan selesai" : "mau reset";

    if (daysUntil <= 0) return isEvent ? "Event ini selesai hari ini." : "Reset hari ini.";
    if (daysUntil === 1) return isEvent ? "1 hari lagi event ini akan selesai." : "1 hari lagi mau reset.";
    return isEvent ? `${daysUntil} hari lagi event ini akan selesai.` : `${daysUntil} hari lagi ${action}.`;
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
                            isPatchWide: true,
                            patchId: true,
                            gameId: true,
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

    // Joki Item "1 Patch" (isPatchWide) sengaja TIDAK punya pilihan konten
    // endgame manual (lihat JokiItemFormFields) -- otomatis mencakup SEMUA
    // konten endgame aktif milik game tsb. Sama seperti pola yang sudah
    // dipakai lib/rawat-akun-service.ts untuk membangun kalender progres
    // customer -- di sini juga butuh data yang sama supaya notifikasi
    // reminder-nya konsisten, jadi diambil sekali di awal per gameId yang
    // muncul, bukan query berulang di dalam loop per line.
    const patchWideGameIds = new Set(
        orders.flatMap((o) => o.lines).map((l) => l.jokiItem).filter((item) => item?.isPatchWide).map((item) => item!.gameId)
    );
    const allEndgameContentByGameId = new Map<
        string,
        { id: string; title: string; description: string; resetCycle: "HARIAN" | "MINGGU_1" | "MINGGU_2" | "MINGGU_3" | "MINGGU_4" | "BULAN_1" | "PATCH_1"; anchorStartDate: Date | null; daysAfterPatchStart: number | null }[]
    >();
    if (patchWideGameIds.size > 0) {
        const allContents = await prisma.endgameContent.findMany({
            where: { gameId: { in: Array.from(patchWideGameIds) }, isActive: true },
            select: {
                id: true,
                title: true,
                description: true,
                resetCycle: true,
                anchorStartDate: true,
                daysAfterPatchStart: true,
                gameId: true,
            },
        });
        for (const content of allContents) {
            const list = allEndgameContentByGameId.get(content.gameId) ?? [];
            list.push(content);
            allEndgameContentByGameId.set(content.gameId, list);
        }
    }

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

            // Sama seperti ensureRawatAkunScheduleSynced di
            // lib/rawat-akun-service.ts: item isPatchWide pakai SEMUA
            // konten endgame game itu (bukan item.endgameContent yang
            // memang selalu kosong untuk mode ini), dan siklus PATCH_1
            // dihitung cuma dari patch yang dipilih -- bukan semua patch
            // game itu.
            const endgameContents = item.isPatchWide
                ? allEndgameContentByGameId.get(item.gameId) ?? []
                : item.endgameContent.map(({ endgameContent }) => endgameContent);
            const schedulePatches = item.isPatchWide && item.patchId
                ? item.game.patches.filter((patch) => patch.id === item.patchId)
                : item.game.patches;

            const tasks = buildAutoTasks(
                { startDate: startOfDay(line.startDate), endDate: startOfDay(line.endDate) },
                endgameContents,
                schedulePatches,
                item.game.patches.flatMap((patch) => patch.events),
                item.includeEvent
            );

            // Satu siklus reset (mis. reset mingguan suatu konten) atau satu
            // event menghasilkan BANYAK task -- satu per hari selama
            // siklus/event itu berlangsung (lihat buildAutoTasks). Tanggal
            // reset/selesai yang SEBENARNYA adalah tanggal PALING AKHIR
            // dalam satu sourceKey, bukan tanggal task manapun yang
            // kebetulan overlap dengan window pengingat -- makanya
            // dikelompokkan dulu di sini, baru diambil nilai maksimalnya.
            const cycles = new Map<string, { category: string; label: string; endDate: Date }>();
            for (const task of tasks) {
                const existing = cycles.get(task.sourceKey);
                if (!existing || task.date > existing.endDate) {
                    cycles.set(task.sourceKey, { category: task.category, label: task.label, endDate: task.date });
                }
            }

            // Dedup per (category, label): kalau ada beberapa siklus dengan
            // label sama yang sama-sama masuk window, cukup tampilkan yang
            // tanggal reset/selesainya PALING DEKAT (paling mendesak).
            const nearestByLabel = new Map<string, { category: string; label: string; endDate: Date }>();
            for (const cycle of cycles.values()) {
                if (cycle.endDate < today || cycle.endDate > horizon) continue;
                const key = `${cycle.category}:${cycle.label}`;
                const existing = nearestByLabel.get(key);
                if (!existing || cycle.endDate < existing.endDate) {
                    nearestByLabel.set(key, cycle);
                }
            }

            for (const [key, cycle] of nearestByLabel) {
                const daysUntil = daysFromToday(cycle.endDate, today);
                notifications.push({
                    id: `task:${line.id}:${key}`,
                    orderId: order.id,
                    orderCode: order.orderCode,
                    href: "",
                    title: cycle.label,
                    detail: formatReminderDetail(cycle.category, daysUntil),
                    tone: daysUntil <= 1 ? "urgent" : "normal",
                });
            }
        }
    }

    return notifications;
}