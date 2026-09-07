/**
 * Aturan penyusunan Paket Joki. Semua fungsi murni (pure), tidak melakukan
 * query database sendiri — data difilter dari daftar yang sudah di-fetch
 * oleh caller (server component / server action).
 */

export interface JokiItemForPaket {
  id: string;
  priceRupiah: number;
  categoryId: string;
  regionId: string | null;
  questTypeId: string | null;
}

export interface CategoryForPaket {
  id: string;
  requiresRegion: boolean; // dipakai untuk mengenali kategori "Eksplorasi"
  requiresQuestType: boolean;
}

export interface QuestTypeForPaket {
  id: string;
  questKind: "WORLD" | "ARCHON" | "LAINNYA";
}

/**
 * Total harga default paket = jumlah priceRupiah semua Joki Item yang
 * dipilih sebagai anggota paket. Admin tetap bisa menimpa nilai ini secara
 * manual di form (field harga tetap plain, bukan computed/readonly).
 */
export function calculatePaketPrice(selectedItems: { priceRupiah: number }[]): number {
  return selectedItems.reduce((sum, item) => sum + item.priceRupiah, 0);
}

/**
 * Joki Item berkategori "Eksplorasi" untuk keperluan Paket: kategori dengan
 * requiresRegion = true (tidak butuh quest type), dan regionId-nya cocok
 * dengan region yang dipilih di paket.
 *
 * Generic supaya tetap mempertahankan properti tambahan pada tipe input
 * (mis. title, gameId) alih-alih menyempitkannya ke JokiItemForPaket.
 */
export function filterExplorationItems<T extends JokiItemForPaket>(
  items: T[],
  categories: CategoryForPaket[],
  regionId: string
): T[] {
  const explorationCategoryIds = new Set(
    categories.filter((c) => c.requiresRegion && !c.requiresQuestType).map((c) => c.id)
  );
  return items.filter(
    (item) => explorationCategoryIds.has(item.categoryId) && item.regionId === regionId
  );
}

/**
 * Joki Item berkategori Quest dengan questKind tertentu (WORLD/ARCHON),
 * difilter ke region yang dipilih di paket. Item quest yang questType-nya
 * tidak region-specific (mis. Archon Quest global) tidak match region
 * manapun secara langsung, sehingga di sini kita hanya menyaring item yang
 * regionId-nya memang terisi dan cocok.
 */
export function filterQuestItemsByKind<T extends JokiItemForPaket>(
  items: T[],
  categories: CategoryForPaket[],
  questTypes: QuestTypeForPaket[],
  regionId: string,
  kind: "WORLD" | "ARCHON"
): T[] {
  const questCategoryIds = new Set(categories.filter((c) => c.requiresQuestType).map((c) => c.id));
  const questTypeIdsOfKind = new Set(questTypes.filter((q) => q.questKind === kind).map((q) => q.id));

  return items.filter(
    (item) =>
      questCategoryIds.has(item.categoryId) &&
      item.questTypeId != null &&
      questTypeIdsOfKind.has(item.questTypeId) &&
      item.regionId === regionId
  );
}
