/**
 * Kirim notifikasi ke bot Discord saat ada event order (order baru / update
 * progress). Ini SENGAJA fire-and-forget: kalau bot sedang down atau
 * BOT_HTTP_URL belum dikonfigurasi, order/update di website tetap harus
 * berhasil tersimpan -- notifikasi Discord adalah "nice to have", bukan
 * bagian kritis dari alur order.
 *
 * Konfigurasi lewat env:
 * - BOT_HTTP_URL: base URL bot (mis. http://localhost:4001, atau URL VPS bot).
 * - DISCORD_BOT_SECRET: token rahasia, HARUS SAMA dengan BOT_HTTP_SECRET di
 *   .env bot.
 */

function botConfigured(): boolean {
  return Boolean(process.env.BOT_HTTP_URL && process.env.DISCORD_BOT_SECRET);
}

async function postToBot(path: string, body: unknown): Promise<void> {
  if (!botConfigured()) return;

  try {
    await fetch(`${process.env.BOT_HTTP_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bot-secret": process.env.DISCORD_BOT_SECRET!,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    // Sengaja hanya di-log, tidak di-throw -- lihat catatan di atas.
    console.error(`[discord-notify] Gagal memanggil bot (${path}):`, err);
  }
}

export interface NotifyOrderCreatedInput {
  orderCode: string;
  customerName: string;
  gameName: string;
  layanan: string;
  totalPrice: number;
  status: string;
  publicSlug: string;
  /** ID user Discord customer, kalau order-nya berasal dari ticket Discord
   * dan kamu ingin bot otomatis membuat channel ticket khusus order ini. */
  discordUserId?: string;
  createTicket?: boolean;
}

export function notifyOrderCreated(input: NotifyOrderCreatedInput): void {
  void postToBot("/api/order-created", input);
}

export interface NotifyOrderProgressInput {
  orderCode: string;
  status: string;
  progressPct: number;
  publicSlug: string;
  note?: string | null;
}

export function notifyOrderProgress(input: NotifyOrderProgressInput): void {
  void postToBot("/api/order-progress", input);
}

/**
 * Beri tahu bot bahwa daftar harga satu game berubah (Joki Item / Paket
 * dibuat, diubah, atau dihapus), supaya bot re-sync tabel harga di channel
 * game terkait (mis. #genshin-impact). Bot yang menentukan channel mana
 * lewat gameSlug -- kita tidak perlu tahu ID channel Discord-nya di sini.
 */
export function notifyPriceListChanged(gameSlug: string): void {
  void postToBot("/api/pricelist-changed", { gameSlug });
}

export interface NotifyTestimonialPublishedInput {
  gameName: string;
  customerName: string;
  rating: number;
  message: string;
}

/**
 * Beri tahu bot bahwa ada testimoni yang baru saja di-approve admin
 * (isPublished berubah dari false ke true), supaya bot post testimoni itu
 * ke channel #testimoni.
 */
export function notifyTestimonialPublished(input: NotifyTestimonialPublishedInput): void {
  void postToBot("/api/testimonial-published", input);
}
