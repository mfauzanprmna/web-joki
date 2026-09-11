interface LineForDisplay {
  jokiItem: { title: string } | null;
  jokiPaket: { title: string } | null;
  patchEvent?: { title: string } | null;
}

/**
 * Gabungkan judul semua baris dalam satu Order jadi satu string ringkas
 * untuk ditampilkan sebagai "nama pesanan" (mis. di antrian/history).
 * - 1 baris -> judul baris itu apa adanya.
 * - >1 baris -> judul baris pertama + "& N lainnya".
 * - 0 baris (seharusnya tidak terjadi) -> fallback "Pesanan kustom".
 */
export function buildOrderTitle(lines: LineForDisplay[]): string {
  const titles = lines.map((l) => l.jokiItem?.title ?? l.jokiPaket?.title ?? l.patchEvent?.title ?? "Item tidak dikenal");

  if (titles.length === 0) return "Pesanan kustom";
  if (titles.length === 1) return titles[0];
  return `${titles[0]} & ${titles.length - 1} lainnya`;
}
