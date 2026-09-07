/**
 * Aturan waktu terkait Patch & PatchEvent. Semua fungsi di sini murni
 * (pure) berdasarkan tanggal — tidak ada state tersimpan soal "sedang
 * tampil atau tidak", supaya status tidak pernah basi/stale.
 */

export interface PatchDateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * PatchEvent tampil ke customer jika waktu sekarang berada di antara
 * startDate dan endDate event tersebut (inklusif).
 */
export function isPatchEventLive(event: PatchDateRange, now: Date = new Date()): boolean {
  return now >= event.startDate && now <= event.endDate;
}

/**
 * Joki Item Rawat Akun "1 patch" (isPatchWide) tampil ke customer sejak
 * Patch terkait DIBUAT (bukan sejak patch.startDate tiba — ini sengaja,
 * supaya rawat akun untuk patch berikutnya bisa mulai dipesan sebelum
 * patch itu berjalan, walau patch sebelumnya belum selesai), dan hilang
 * begitu H+1 dari patch.startDate terlewati.
 *
 * Contoh: Patch 5.1 dibuat tanggal 1 Agu, startDate 10 Agu. Rawat akun
 * 1-patch untuk Patch 5.1 tampil dari 1 Agu, dan hilang mulai 11 Agu
 * (H+1 setelah startDate).
 */
export function isPatchWideRawatAkunLive(patch: PatchDateRange, now: Date = new Date()): boolean {
  const hidesAt = addDays(patch.startDate, 1);
  return now < hidesAt;
}

/**
 * Patch dianggap "sedang berjalan" jika waktu sekarang berada dalam
 * rentang startDate–endDate-nya. Dipakai untuk menentukan Patch mana
 * yang jadi acuan EndgameContent bersiklus PATCH_1, dan untuk toggle
 * "includeEvent" pada Joki Item Rawat Akun (event dari patch yang
 * sedang berjalan yang ikut disertakan).
 */
export function isPatchOngoing(patch: PatchDateRange, now: Date = new Date()): boolean {
  return now >= patch.startDate && now <= patch.endDate;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
