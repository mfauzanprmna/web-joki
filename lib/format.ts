export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export const STATUS_LABEL: Record<string, string> = {
  MENUNGGU: "Menunggu giliran",
  DIKERJAKAN: "Sedang dikerjakan",
  FINISHING: "Finishing",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
};
