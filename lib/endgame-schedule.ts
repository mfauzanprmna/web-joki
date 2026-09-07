import { addDays, isPatchOngoing, type PatchDateRange } from "./patch-schedule";

export type ResetCycle = "HARIAN" | "MINGGU_1" | "MINGGU_2" | "MINGGU_3" | "BULAN_1" | "PATCH_1";

export const RESET_CYCLE_LABEL: Record<ResetCycle, string> = {
  HARIAN: "Harian",
  MINGGU_1: "1 minggu",
  MINGGU_2: "2 minggu",
  MINGGU_3: "3 minggu",
  BULAN_1: "1 bulan",
  PATCH_1: "1 patch",
};

const CYCLE_DAYS: Partial<Record<ResetCycle, number>> = {
  HARIAN: 1,
  MINGGU_1: 7,
  MINGGU_2: 14,
  MINGGU_3: 21,
  // BULAN_1 ditangani khusus (bukan kelipatan hari tetap, lihat di bawah).
};

export interface EndgameContentLike {
  resetCycle: ResetCycle;
  anchorStartDate: Date | null;
  daysAfterPatchStart: number | null;
}

export interface CurrentCycleResult {
  /** Apakah konten ini sedang aktif/tampil ke customer saat ini. */
  isLive: boolean;
  /** Tanggal mulai periode reset yang sedang berjalan (null jika tidak bisa dihitung). */
  periodStart: Date | null;
  /** Tanggal berakhir periode reset yang sedang berjalan (null jika tidak bisa dihitung). */
  periodEnd: Date | null;
}

/**
 * Menghitung apakah sebuah EndgameContent sedang "live" (tampil ke customer)
 * pada waktu `now`, beserta rentang periode reset yang sedang berjalan.
 *
 * - MINGGU_1/2/3: berulang otomatis tiap N hari dari anchorStartDate. Selalu
 *   live setelah anchorStartDate terlewati (karena selalu ada periode yang
 *   sedang berjalan) — periodStart/periodEnd berguna untuk ditampilkan ke
 *   customer sebagai "reset berikutnya".
 * - BULAN_1: berulang tiap bulan kalender dari tanggal anchorStartDate.
 * - PATCH_1: live jika ada Patch yang sedang berjalan (isPatchOngoing) DAN
 *   waktu sekarang sudah melewati (patch.startDate + daysAfterPatchStart).
 *   periodEnd mengikuti endDate patch yang sedang berjalan itu.
 */
export function getCurrentCycle(
  content: EndgameContentLike,
  now: Date = new Date(),
  ongoingPatch?: PatchDateRange | null
): CurrentCycleResult {
  if (content.resetCycle === "PATCH_1") {
    if (!ongoingPatch || !isPatchOngoing(ongoingPatch, now)) {
      return { isLive: false, periodStart: null, periodEnd: null };
    }
    const availableFrom = addDays(ongoingPatch.startDate, content.daysAfterPatchStart ?? 0);
    if (now < availableFrom) {
      return { isLive: false, periodStart: availableFrom, periodEnd: ongoingPatch.endDate };
    }
    return { isLive: true, periodStart: availableFrom, periodEnd: ongoingPatch.endDate };
  }

  if (!content.anchorStartDate) {
    return { isLive: false, periodStart: null, periodEnd: null };
  }

  if (now < content.anchorStartDate) {
    return { isLive: false, periodStart: null, periodEnd: content.anchorStartDate };
  }

  if (content.resetCycle === "BULAN_1") {
    return getCurrentMonthlyCycle(content.anchorStartDate, now);
  }

  const cycleDays = CYCLE_DAYS[content.resetCycle];
  if (!cycleDays) {
    return { isLive: false, periodStart: null, periodEnd: null };
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const elapsedDays = Math.floor((now.getTime() - content.anchorStartDate.getTime()) / msPerDay);
  const periodsElapsed = Math.floor(elapsedDays / cycleDays);
  const periodStart = addDays(content.anchorStartDate, periodsElapsed * cycleDays);
  const periodEnd = addDays(periodStart, cycleDays);

  return { isLive: true, periodStart, periodEnd };
}

function getCurrentMonthlyCycle(anchorStartDate: Date, now: Date): CurrentCycleResult {
  const periodStart = new Date(anchorStartDate);
  // Guard: cukup untuk menjangkau 200 tahun ke depan, jauh melebihi kebutuhan
  // wajar; mencegah infinite loop jika terjadi input tanggal yang tidak masuk akal.
  const maxIterations = 2400;

  for (let i = 0; i < maxIterations; i++) {
    const nextPeriodStart = addMonths(periodStart, 1);
    if (nextPeriodStart > now) {
      return { isLive: true, periodStart, periodEnd: nextPeriodStart };
    }
    periodStart.setTime(nextPeriodStart.getTime());
  }

  return { isLive: false, periodStart: null, periodEnd: null };
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}
