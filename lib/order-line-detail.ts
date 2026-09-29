import type { OrderLineDetail } from "@/components/OrderLineDetailPanel";
import { enumerateDays, isoDay } from "@/lib/rawat-akun-schedule";

export interface OrderLineForDetail {
  id: string;
  jokiItem: { title: string; category: { isRawatAkun: boolean } } | null;
  jokiPaket: { title: string } | null;
  patchEvent: { title: string } | null;
  endgameContent: { title: string } | null;
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
}

/**
 * Bangun OrderLineDetail[] (dipakai OrderLineDetailPanel / tombol "Lihat
 * Detail" di HistoryRow) dari baris order Prisma. Judul baris memakai
 * fallback jokiItem -> jokiPaket -> patchEvent -> endgameContent, supaya
 * baris yang berasal dari Event atau konten Endgame tidak jatuh ke
 * "Item tidak dikenal" hanya karena satu dari empat sumber judul ini
 * terlewat di-include/select saat query.
 *
 * Dipakai bersama oleh /history (semua history) dan /progress/[slug]
 * (history khusus 1 customer) supaya perilaku "Lihat Detail" konsisten
 * di kedua tempat.
 */
export function buildOrderLineDetails(lines: OrderLineForDetail[]): OrderLineDetail[] {
  return lines.map((line) => {
    const isRawatAkun = line.jokiItem?.category.isRawatAkun ?? false;
    return {
      id: line.id,
      title:
        line.jokiItem?.title ??
        line.jokiPaket?.title ??
        line.patchEvent?.title ??
        line.endgameContent?.title ??
        "Item tidak dikenal",
      explorationPercent: line.explorationPercent,
      actFrom: line.actFrom,
      actTo: line.actTo,
      materialQuantity: line.materialQuantity,
      rawatAkunQuantity: line.rawatAkunQuantity,
      characterName: line.characterName ?? null,
      levelFrom: line.levelFrom ?? null,
      levelTo: line.levelTo ?? null,
      updates: line.updates.map((update) => ({
        id: update.id,
        note: update.note,
        screenshotUrl: update.screenshotUrl,
        resetLocation: update.resetLocation,
        createdAt: update.createdAt.toISOString(),
      })),
      rawatAkun:
        isRawatAkun && line.startDate && line.endDate
          ? {
            days: enumerateDays(line.startDate, line.endDate).map((date) => {
              const iso = isoDay(date);
              const dayProgress = line.dayProgress.find(
                (progress) => isoDay(progress.date) === iso,
              );
              return {
                date: iso,
                percent: dayProgress?.percent ?? 0,
                note: dayProgress?.note ?? null,
                screenshotUrls: dayProgress?.screenshotUrls ?? [],
              };
            }),
            tasks: line.dayTasks.map((task) => ({
              date: isoDay(task.date),
              category: task.category,
              label: task.label,
              status: task.status as "BELUM" | "SEDANG" | "SELESAI",
            })),
          }
          : null,
    };
  });
}
