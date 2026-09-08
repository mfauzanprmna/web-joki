/**
 * Logika murni (tidak melakukan query DB) untuk menghitung rentang tanggal
 * pengerjaan sebuah OrderLine Rawat Akun, dan membangun daftar task harian
 * otomatis dari konten endgame yang dicakup Joki Item-nya beserta event
 * patch yang jatuh pada rentang tersebut (jika includeEvent aktif).
 *
 * Ini yang mengimplementasikan aturan: "rawat akun 1 bulan -> cek event/
 * konten endgame yang sudah dibuat, mana saja yang tanggalnya jatuh di
 * antara mulai joki sampai selesai joki".
 */

import { addDays } from "./patch-schedule";

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isoDay(date: Date): string {
  return startOfDay(date).toISOString().slice(0, 10);
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/** Daftar tanggal (00:00) dari start s/d end, inklusif kedua ujungnya. */
export function enumerateDays(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  let cursor = startOfDay(start);
  const last = startOfDay(end);
  let guard = 0;
  while (cursor.getTime() <= last.getTime() && guard < 3660) {
    days.push(new Date(cursor));
    cursor = addDays(cursor, 1);
    guard++;
  }
  return days;
}

export interface RawatAkunItemLike {
  isPatchWide: boolean;
  durationDays: number | null;
  patch: { startDate: Date; endDate: Date } | null;
}

export interface RawatAkunPeriod {
  startDate: Date;
  endDate: Date;
}

/**
 * Menghitung rentang tanggal pengerjaan (startDate..endDate) sebuah baris
 * OrderLine Rawat Akun.
 * - isPatchWide: mengikuti rentang tanggal Patch terkait apa adanya.
 * - Non patch-wide: startDate = tanggal mulai yang dipilih admin,
 *   endDate = startDate + (durationDays x quantity - 1) hari.
 * Mengembalikan null jika data belum cukup untuk dihitung (mis. durationDays
 * belum diisi admin di Joki Item-nya).
 */
export function computeRawatAkunPeriod(
  item: RawatAkunItemLike,
  quantity: number,
  requestedStartDate: Date
): RawatAkunPeriod | null {
  if (item.isPatchWide) {
    if (!item.patch) return null;
    return { startDate: startOfDay(item.patch.startDate), endDate: startOfDay(item.patch.endDate) };
  }
  if (!item.durationDays || item.durationDays <= 0) return null;
  const totalDays = item.durationDays * Math.max(1, quantity);
  const start = startOfDay(requestedStartDate);
  return { startDate: start, endDate: addDays(start, totalDays - 1) };
}

export interface EndgameContentForSchedule {
  id: string;
  title: string;
  description: string;
  resetCycle: "HARIAN" | "MINGGU_1" | "MINGGU_2" | "MINGGU_3" | "MINGGU_4" | "BULAN_1" | "PATCH_1";
  anchorStartDate: Date | null;
  daysAfterPatchStart: number | null;
}

export interface PatchForSchedule {
  id: string;
  startDate: Date;
  endDate: Date;
}

export interface PatchEventForSchedule {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
}

export interface AutoTaskDef {
  date: Date;
  category: string;
  label: string;
  sourceKey: string;
}

const WEEKLY_CYCLE_DAYS: Partial<Record<string, number>> = {
  MINGGU_1: 7,
  MINGGU_2: 14,
  MINGGU_3: 21,
  MiNGGU_4: 28,
};

/**
 * Membangun daftar task harian otomatis untuk sebuah periode Rawat Akun,
 * dari konten endgame yang dicakup Joki Item (endgameContents) dan, jika
 * includeEvent aktif, seluruh PatchEvent milik game ini yang tanggalnya
 * overlap dengan periode tersebut.
 */
export function buildAutoTasks(
  period: RawatAkunPeriod,
  endgameContents: EndgameContentForSchedule[],
  patches: PatchForSchedule[],
  events: PatchEventForSchedule[],
  includeEvent: boolean
): AutoTaskDef[] {
  const tasks: AutoTaskDef[] = [];

  for (const content of endgameContents) {
    if (content.resetCycle === "HARIAN") {
      for (const d of enumerateDays(period.startDate, period.endDate)) {
        tasks.push({
          date: d,
          category: content.title,
          label: content.description || content.title,
          sourceKey: `egc:${content.id}:${isoDay(d)}`,
        });
      }
      continue;
    }

    if (content.resetCycle === "PATCH_1") {
      for (const patch of patches) {
        const availableFrom = startOfDay(addDays(patch.startDate, content.daysAfterPatchStart ?? 0));
        const patchEnd = startOfDay(patch.endDate);
        if (availableFrom > patchEnd) continue;
        const clippedStart = availableFrom > period.startDate ? availableFrom : period.startDate;
        const clippedEnd = patchEnd < period.endDate ? patchEnd : period.endDate;
        if (clippedStart.getTime() > clippedEnd.getTime()) continue;
        // Satu sourceKey untuk seluruh masa berlaku konten ini di patch tsb --
        // status yang di-update pada tanggal manapun berlaku maju sampai akhir
        // masa berlaku (lihat updateDayTaskStatus), reset lagi di patch berikutnya.
        const cycleKey = `egc:${content.id}:patch:${patch.id}`;
        for (const d of enumerateDays(clippedStart, clippedEnd)) {
          tasks.push({
            date: d,
            category: content.title,
            label: content.description || content.title,
            sourceKey: cycleKey,
          });
        }
      }
      continue;
    }

    if (!content.anchorStartDate) continue;
    const anchor = startOfDay(content.anchorStartDate);

    const cycleDays = WEEKLY_CYCLE_DAYS[content.resetCycle];
    if (cycleDays) {
      let occurrence = anchor;
      if (occurrence < period.startDate) {
        const diffDays = Math.floor((period.startDate.getTime() - occurrence.getTime()) / 86400000);
        const steps = Math.floor(diffDays / cycleDays);
        occurrence = addDays(occurrence, steps * cycleDays);
      }
      let guard = 0;
      while (occurrence.getTime() <= period.endDate.getTime() && guard < 500) {
        // Jendela 1 siklus penuh (mis. 7 hari utk mingguan) sebelum reset lagi.
        const windowEnd = addDays(occurrence, cycleDays - 1);
        const clippedStart = occurrence > period.startDate ? occurrence : period.startDate;
        const clippedEnd = windowEnd < period.endDate ? windowEnd : period.endDate;
        if (clippedStart.getTime() <= clippedEnd.getTime()) {
          // Satu sourceKey per siklus -- centang di tanggal manapun dalam
          // jendela ini berlaku maju sampai akhir jendela (reset di siklus
          // berikutnya karena sourceKey-nya beda).
          const cycleKey = `egc:${content.id}:cycle:${isoDay(occurrence)}`;
          for (const d of enumerateDays(clippedStart, clippedEnd)) {
            tasks.push({
              date: d,
              category: content.title,
              label: content.description || content.title,
              sourceKey: cycleKey,
            });
          }
        }
        occurrence = addDays(occurrence, cycleDays);
        guard++;
      }
      continue;
    }

    if (content.resetCycle === "BULAN_1") {
      let occurrence = anchor;
      let guard = 0;
      while (occurrence.getTime() <= period.endDate.getTime() && guard < 240) {
        const nextOccurrence = startOfDay(addMonths(occurrence, 1));
        const windowEnd = addDays(nextOccurrence, -1);
        const clippedStart = occurrence > period.startDate ? occurrence : period.startDate;
        const clippedEnd = windowEnd < period.endDate ? windowEnd : period.endDate;
        if (clippedStart.getTime() <= clippedEnd.getTime()) {
          const cycleKey = `egc:${content.id}:cycle:${isoDay(occurrence)}`;
          for (const d of enumerateDays(clippedStart, clippedEnd)) {
            tasks.push({
              date: d,
              category: content.title,
              label: content.description || content.title,
              sourceKey: cycleKey,
            });
          }
        }
        occurrence = nextOccurrence;
        guard++;
      }
    }
  }

  if (includeEvent) {
    for (const ev of events) {
      const evStart = startOfDay(ev.startDate);
      const evEnd = startOfDay(ev.endDate);
      const overlapStart = evStart > period.startDate ? evStart : period.startDate;
      const overlapEnd = evEnd < period.endDate ? evEnd : period.endDate;
      if (overlapStart.getTime() > overlapEnd.getTime()) continue;
      for (const d of enumerateDays(overlapStart, overlapEnd)) {
        tasks.push({
          date: d,
          category: "Event",
          label: ev.title,
          sourceKey: `event:${ev.id}:${isoDay(d)}`,
        });
      }
    }
  }

  return tasks;
}
