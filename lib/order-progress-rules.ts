/**
 * Aturan menentukan jenis input tambahan yang relevan saat admin menambah
 * update progress untuk satu OrderLine.
 *
 * - Item Rawat Akun yang mencakup EndgameContent bersiklus HARIAN (mis.
 *   Daily Commission/habiskan resin) -> field "resetLocation" (opsional).
 * - Item Rawat Akun lain, atau kategori apapun di luar itu -> field
 *   "screenshotUrl" (opsional) sebagai bukti progres/selesai.
 * Kedua field selalu boleh diisi bersamaan; ini hanya menentukan field mana
 * yang ditonjolkan/direkomendasikan di form.
 */

export interface OrderLineForProgressRules {
  jokiItem: {
    category: { isRawatAkun: boolean };
    endgameContent: { endgameContent: { resetCycle: string } }[];
  } | null;
}

export function hasDailyResetContent(line: OrderLineForProgressRules): boolean {
  if (!line.jokiItem || !line.jokiItem.category.isRawatAkun) return false;
  return line.jokiItem.endgameContent.some((e) => e.endgameContent.resetCycle === "HARIAN");
}
