interface LineForDisplay {
  jokiItem: { title: string } | null;
  jokiPaket: { title: string } | null;
  patchEvent?: { title: string } | null;
  endgameContent?: { title: string } | null;
  jokiPaketId?: string | null;
  paketGroupId?: string | null;
}

/**
 * Gabungkan judul semua baris dalam satu Order jadi satu string ringkas
 * untuk ditampilkan sebagai "nama pesanan" (mis. di antrian/history).
 * - 1 baris -> judul baris itu apa adanya.
 * - >1 baris -> judul baris pertama + "& N lainnya".
 * - 0 baris (seharusnya tidak terjadi) -> fallback "Pesanan kustom".
 *
 * Baris hasil pecahan SATU pembelian Paket Joki (lihat OrderLine.paketGroupId
 * di schema.prisma) punya jokiItemId DAN jokiPaketId yang sama-sama terisi.
 * Untuk ringkasan ini, baris-baris tsb HARUS dianggap SATU entri "nama
 * paketnya" -- bukan dihitung/ditampilkan satu-satu per Joki Item isinya --
 * jadi jokiPaketId dicek lebih dulu, dan baris dengan paketGroupId (atau
 * jokiPaketId untuk data lama) yang sama cuma dihitung sekali.
 */
export function buildOrderTitle(lines: LineForDisplay[]): string {
  const seenPaketGroups = new Set<string>();
  const titles: string[] = [];

  for (const l of lines) {
    if (l.jokiPaketId) {
      const groupKey = l.paketGroupId ?? l.jokiPaketId;
      if (seenPaketGroups.has(groupKey)) continue;
      seenPaketGroups.add(groupKey);
      titles.push(l.jokiPaket?.title ?? "Item tidak dikenal");
      continue;
    }
    titles.push(l.jokiItem?.title ?? l.patchEvent?.title ?? l.endgameContent?.title ?? "Item tidak dikenal");
  }

  if (titles.length === 0) return "Pesanan kustom";
  if (titles.length === 1) return titles[0];
  return `${titles[0]} & ${titles.length - 1} lainnya`;
}
