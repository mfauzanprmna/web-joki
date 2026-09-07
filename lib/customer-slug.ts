/**
 * Generate slug acak untuk URL publik /progress/[slug]. Menggabungkan
 * karakter alfanumerik acak (bukan urutan angka mudah ditebak seperti ID
 * database) supaya link progress customer tidak mudah ditebak orang lain,
 * tapi tetap pendek untuk dibagikan lewat chat.
 */
const ALPHABET = "abcdefghijkmnopqrstuvwxyz23456789"; // tanpa 0/O/1/l/I biar tidak rancu

export function generateCustomerSlug(length = 10): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return result;
}
