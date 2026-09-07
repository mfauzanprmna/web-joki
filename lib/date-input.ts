/**
 * Format Date menjadi string yang kompatibel dengan <input type="datetime-local">
 * (format: YYYY-MM-DDTHH:mm, dalam waktu lokal browser/server).
 */
export function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}
