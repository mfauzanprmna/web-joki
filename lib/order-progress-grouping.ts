/**
 * Helper murni (tanpa query DB) untuk mengelompokkan OrderLine jadi struktur
 * tab 2 level di halaman progress (admin & customer):
 *   Level 1 = kategori (Rawat Akun, Eksplorasi, Quest, Material, Lainnya)
 *   Level 2 = cuma ada untuk kategori yang punya "dimensi" tambahan:
 *     - Eksplorasi -> per Region
 *     - Quest -> per jenis (Archon Quest / World Quest / Lainnya)
 * Baris Paket (jokiPaketId terisi) SENGAJA dikeluarkan dari pengelompokan
 * ini -- paket selalu tampil sebagai tab tersendiri di luar struktur ini.
 */

export type ProgressCategoryKind =
  | "RAWAT_AKUN"
  | "EKSPLORASI"
  | "QUEST"
  | "MATERIAL"
  | "EVENT"
  | "ENDGAME"
  | "OTHER";

export const CATEGORY_KIND_LABEL: Record<ProgressCategoryKind, string> = {
  RAWAT_AKUN: "Rawat Akun",
  EKSPLORASI: "Eksplorasi",
  QUEST: "Quest",
  MATERIAL: "Material",
  EVENT: "Event",
  ENDGAME: "Endgame",
  OTHER: "Lainnya",
};

const CATEGORY_ORDER: ProgressCategoryKind[] = [
  "RAWAT_AKUN",
  "EKSPLORASI",
  "QUEST",
  "MATERIAL",
  "EVENT",
  "ENDGAME",
  "OTHER",
];

export interface LineForGrouping {
  id: string;
  jokiPaketId?: string | null;
  /// Lihat komentar field ini di schema.prisma (model OrderLine) -- menandai
  /// baris-baris yang berasal dari SATU KALI pembelian Paket yang sama.
  paketGroupId?: string | null;
  /// Judul Paket Joki asalnya (bukan judul Joki Item baris ini sendiri) --
  /// dipakai sebagai label tab "Paket X" & breakdown isi paket. Cuma relevan
  /// kalau jokiPaketId terisi.
  jokiPaketTitle?: string | null;
  jokiItem: {
    category: {
      isRawatAkun: boolean;
      requiresRegion: boolean;
      requiresQuestType: boolean;
      isMaterial: boolean;
    };
    region: { name: string } | null;
    questType: { name: string; questKind: string } | null;
  } | null;
  patchEvent?: { title: string } | null;
  endgameContent?: { title: string } | null;
}

export function getCategoryKind(line: LineForGrouping): ProgressCategoryKind {
  if (line.patchEvent) return "EVENT";
  if (line.endgameContent) return "ENDGAME";
  const cat = line.jokiItem?.category;
  if (!cat) return "OTHER";
  if (cat.isRawatAkun) return "RAWAT_AKUN";
  if (cat.requiresRegion) return "EKSPLORASI";
  if (cat.requiresQuestType) return "QUEST";
  if (cat.isMaterial) return "MATERIAL";
  return "OTHER";
}

function questKindLabel(kind: string | undefined): string {
  if (kind === "ARCHON") return "Archon Quest";
  if (kind === "WORLD") return "World Quest";
  return "Lainnya";
}

export interface SubGroup<T> {
  key: string;
  label: string;
  lines: T[];
}

export interface CategoryGroup<T> {
  kind: ProgressCategoryKind;
  label: string;
  /** Kosong array berarti tidak perlu tab level-2, langsung tampilkan lines gabungan. */
  hasSubTabs: boolean;
  subGroups: SubGroup<T>[];
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): SubGroup<T>[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries()).map(([key, lines]) => ({ key, label: key, lines }));
}

/** Inti pengelompokan per kategori, TANPA asumsi soal jokiPaketId -- dipakai
 * baik untuk baris top-level non-paket maupun untuk baris-baris di DALAM
 * satu grup pembelian paket (yang keduanya sama-sama "flat list of lines"
 * pada titik ini, cuma beda konteks pemanggilnya). */
function groupByCategoryRaw<T extends LineForGrouping>(lines: T[]): CategoryGroup<T>[] {
  const byKind = new Map<ProgressCategoryKind, T[]>();
  for (const line of lines) {
    const kind = getCategoryKind(line);
    if (!byKind.has(kind)) byKind.set(kind, []);
    byKind.get(kind)!.push(line);
  }

  const groups: CategoryGroup<T>[] = [];
  for (const kind of CATEGORY_ORDER) {
    const linesInKind = byKind.get(kind);
    if (!linesInKind || linesInKind.length === 0) continue;

    if (kind === "EKSPLORASI") {
      const subGroups = groupBy(linesInKind, (l) => l.jokiItem?.region?.name ?? "Lainnya");
      groups.push({ kind, label: CATEGORY_KIND_LABEL[kind], hasSubTabs: subGroups.length > 1, subGroups });
    } else if (kind === "QUEST") {
      const subGroups = groupBy(linesInKind, (l) => questKindLabel(l.jokiItem?.questType?.questKind));
      groups.push({ kind, label: CATEGORY_KIND_LABEL[kind], hasSubTabs: subGroups.length > 1, subGroups });
    } else {
      groups.push({
        kind,
        label: CATEGORY_KIND_LABEL[kind],
        hasSubTabs: false,
        subGroups: [{ key: "all", label: "", lines: linesInKind }],
      });
    }
  }

  return groups;
}

/** Baris non-Paket, dikelompokkan per kategori (+ sub-tab utk Eksplorasi/Quest). */
export function groupLinesByCategory<T extends LineForGrouping>(lines: T[]): CategoryGroup<T>[] {
  const nonPaketLines = lines.filter((l) => !l.jokiPaketId);
  return groupByCategoryRaw(nonPaketLines);
}

/** Sama seperti groupLinesByCategory, tapi untuk dipakai KHUSUS di dalam satu
 * tab Paket -- baris yang masuk di sini SUDAH PASTI baris isi paket
 * (jokiPaketId terisi), jadi tidak boleh dikeluarkan lagi seperti di
 * groupLinesByCategory (yang justru mengeluarkan baris paket). */
export function groupPaketItemsByCategory<T extends LineForGrouping>(lines: T[]): CategoryGroup<T>[] {
  return groupByCategoryRaw(lines);
}

/** Baris Paket saja (selalu tab tersendiri, di luar pengelompokan kategori),
 * dikelompokkan lagi PER PEMBELIAN (paketGroupId) -- satu kali pembelian
 * Paket Joki bisa terdiri dari beberapa OrderLine (satu per Joki Item isi
 * paket), dan semuanya harus tampil sebagai SATU tab "Paket X", bukan
 * banyak tab terpisah. Data lama (order sebelum ada paketGroupId) tetap
 * kebaca benar: setiap baris jadi grupnya sendiri (fallback ke id baris). */
export interface PaketPurchaseGroup<T> {
  key: string;
  jokiPaketId: string;
  title: string;
  lines: T[];
}

export function groupPaketPurchases<T extends LineForGrouping>(lines: T[]): PaketPurchaseGroup<T>[] {
  const paketLines = lines.filter((l): l is T & { jokiPaketId: string } => !!l.jokiPaketId);
  const map = new Map<string, PaketPurchaseGroup<T>>();
  for (const line of paketLines) {
    const key = line.paketGroupId ?? line.id;
    const existing = map.get(key);
    if (existing) {
      existing.lines.push(line);
    } else {
      map.set(key, {
        key,
        jokiPaketId: line.jokiPaketId,
        title: line.jokiPaketTitle ?? "Paket",
        lines: [line],
      });
    }
  }
  return Array.from(map.values());
}

/** Target hitungan buat progress bar Quest (jumlah Act) / Material (jumlah satuan). */
export function getLineProgressTarget(line: {
  jokiItem: { category: { requiresQuestType: boolean; isMaterial: boolean } } | null;
  actFrom: number | null;
  actTo: number | null;
  materialQuantity: number | null;
}): number | null {
  if (!line.jokiItem) return null;
  if (line.jokiItem.category.requiresQuestType) {
    if (line.actFrom == null || line.actTo == null) return null;
    return line.actTo - line.actFrom + 1;
  }
  if (line.jokiItem.category.isMaterial) {
    return line.materialQuantity ?? null;
  }
  return null;
}

/** Label kategori 1 baris JokiItem (dipakai buat breakdown isi Paket, read-only). */
export function getJokiItemCategoryLabel(item: {
  category: {
    isRawatAkun: boolean;
    requiresRegion: boolean;
    requiresQuestType: boolean;
    isMaterial: boolean;
  };
  region: { name: string } | null;
  questType: { name: string; questKind: string } | null;
}): string {
  const kind = getCategoryKind({ id: "", jokiItem: item });
  if (kind === "EKSPLORASI" && item.region) return `${CATEGORY_KIND_LABEL[kind]} - ${item.region.name}`;
  if (kind === "QUEST" && item.questType) {
    const kindLabel =
      item.questType.questKind === "ARCHON"
        ? "Archon Quest"
        : item.questType.questKind === "WORLD"
          ? "World Quest"
          : item.questType.name;
    return `${CATEGORY_KIND_LABEL[kind]} - ${kindLabel}`;
  }
  return CATEGORY_KIND_LABEL[kind];
}
