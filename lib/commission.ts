/**
 * Pembagian komisi worker: tetap 80% dari totalPrice order yang mereka
 * kerjakan (sisanya 20% untuk Shihu Service). Kalau nanti perlu persentase
 * berbeda per order/worker, ubah di sini jadi field per Order/Worker --
 * untuk sekarang sengaja dibuat konstanta biar simpel.
 */
export const WORKER_COMMISSION_RATE = 0.8;

export function calculateWorkerCommission(totalPrice: number): number {
    return Math.round(totalPrice * WORKER_COMMISSION_RATE);
}