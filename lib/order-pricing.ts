/**
 * Aturan perhitungan harga OrderLine. Semua fungsi murni (pure) — tidak
 * melakukan query database, hanya menghitung dari data yang sudah di-fetch
 * oleh caller (server action / server component).
 *
 * Rumus per kategori:
 * - Eksplorasi: harga di Joki Item adalah harga PER 1% progress. Total =
 *   (100 - persentase yang sudah dikerjakan customer sendiri) x harga.
 *   Semakin besar persentase yang sudah dikerjakan, semakin murah, karena
 *   joki hanya perlu menyelesaikan sisanya.
 * - Quest: (actTo - actFrom + 1) x harga per Act.
 * - Material: (harga Joki Item / unitQuantity Joki Item) x jumlah yang
 *   diminta customer -- dihitung harga per 1 material dulu, baru dikalikan.
 * - Rawat Akun: jumlah (mis. jumlah minggu/siklus) x harga Joki Item.
 * - Paket Joki: harga tetap apa adanya dari JokiPaket.priceRupiah, tidak
 *   ada input tambahan atau perhitungan.
 */

export interface JokiItemForPricing {
  priceRupiah: number;
  unitQuantity: number | null;
  category: {
    requiresRegion: boolean;
    requiresQuestType: boolean;
    isMaterial: boolean;
    isRawatAkun: boolean;
  };
}

export interface OrderLineInput {
  explorationPercent?: number | null;
  actFrom?: number | null;
  actTo?: number | null;
  materialQuantity?: number | null;
  rawatAkunQuantity?: number | null;
}

export interface PriceResult {
  valid: boolean;
  price: number;
  error?: string;
}

/**
 * Menentukan kategori mana yang berlaku untuk sebuah Joki Item, dan
 * menghitung harganya berdasarkan input OrderLine terkait.
 */
export function calculateJokiItemLinePrice(
  item: JokiItemForPricing,
  input: OrderLineInput
): PriceResult {
  const { category } = item;

  if (category.isMaterial) {
    if (!item.unitQuantity || item.unitQuantity <= 0) {
      return { valid: false, price: 0, error: "Joki Item material ini belum punya jumlah satuan yang valid." };
    }
    const quantity = input.materialQuantity;
    if (!quantity || quantity <= 0) {
      return { valid: false, price: 0, error: "Jumlah material yang dicari wajib diisi (lebih dari 0)." };
    }
    const pricePerUnit = item.priceRupiah / item.unitQuantity;
    return { valid: true, price: Math.round(pricePerUnit * quantity) };
  }

  if (category.requiresQuestType) {
    const actFrom = input.actFrom ?? 1;
    const actTo = input.actTo ?? actFrom;
    if (actTo < actFrom) {
      return { valid: false, price: 0, error: "Act selesai tidak boleh lebih kecil dari Act mulai." };
    }
    const actCount = actTo - actFrom + 1;
    return { valid: true, price: actCount * item.priceRupiah };
  }

  if (category.requiresRegion) {
    const percent = input.explorationPercent;
    if (percent == null || percent < 0 || percent > 100) {
      return { valid: false, price: 0, error: "Persentase map yang sudah dikerjakan wajib diisi (0-100)." };
    }
    const remaining = 100 - percent;
    return { valid: true, price: Math.round(remaining * item.priceRupiah) };
  }

  if (category.isRawatAkun) {
    const quantity = input.rawatAkunQuantity ?? 1;
    if (quantity <= 0) {
      return { valid: false, price: 0, error: "Jumlah rawat akun wajib diisi (lebih dari 0)." };
    }
    return { valid: true, price: quantity * item.priceRupiah };
  }

  // Kategori lain (Push Rank, Daily Commission, dll) -> harga tetap.
  return { valid: true, price: item.priceRupiah };
}
