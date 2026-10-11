/**
 * Pembagian komisi worker: persentase tertentu dari totalPrice order yang
 * mereka kerjakan (sisanya untuk Shihu Service). Persentasenya diatur admin
 * lewat menu Setting (/admin/setting) dan disimpan di tabel AppSetting --
 * baca lewat getWorkerCommissionPercent() di lib/settings.ts (khusus
 * server).
 *
 * File ini SENGAJA murni (tanpa akses database) karena juga diimpor
 * komponen client (OrderRowItem). Server component yang butuh komisi harus
 * ambil persentasenya dulu dari lib/settings.ts, lalu oper ke sini --
 * atau, untuk komponen client, oper sebagai prop.
 */
export const DEFAULT_WORKER_COMMISSION_PERCENT = 80;

export function calculateWorkerCommission(totalPrice: number, percent: number): number {
  return Math.round((totalPrice * percent) / 100);
}
