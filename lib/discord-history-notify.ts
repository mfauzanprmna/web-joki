/**
 * Beri tahu bot Discord secara real-time saat ada history BARU (order baru
 * SELESAI, atau admin menambahkan JokiHistoryEntry manual baru) supaya bot
 * langsung memposting ke channel history game yang sesuai -- tanpa nunggu
 * admin menjalankan /sync-history manual.
 *
 * PENTING: project ini sudah punya lib/discord-notify.ts (dipakai untuk
 * notifyOrderCreated/notifyOrderProgress ke #order-log). Sebaiknya fungsi
 * notifyHistoryPosted di bawah ini DIPINDAHKAN ke file itu saja (bukan file
 * baru terpisah), supaya base URL & secret bot cuma didefinisikan sekali.
 * Dibuat terpisah di sini cuma supaya gampang di-review dulu.
 *
 * Env var yang dipakai -- SAMA PERSIS dengan yang sudah ada di
 * lib/discord-notify.ts kamu (lihat README bot, bagian "Sambungkan ke web
 * Next.js"), jadi kalau notifyOrderCreated/notifyOrderProgress sudah jalan,
 * dua env var ini sudah pasti ada:
 *  - BOT_HTTP_URL       -> base URL bot (mis. http://localhost:4001 saat
 *    dev, atau URL publik bot kalau sudah di-deploy).
 *  - DISCORD_BOT_SECRET -> HARUS SAMA PERSIS dengan BOT_SHARED_SECRET di
 *    .env bot Discord.
 */

const BOT_HTTP_URL = process.env.BOT_HTTP_URL;
const DISCORD_BOT_SECRET = process.env.DISCORD_BOT_SECRET;

export interface HistoryLinePayload {
  title: string;
  isRawatAkun: boolean;
  screenshotUrls: string[];
}

export interface HistoryEntryPayload {
  /** Format "order:<orderId>" atau "manual:<jokiHistoryEntryId>". */
  id: string;
  source: "order" | "manual";
  orderCode: string | null;
  gameSlug: string;
  gameName: string;
  customerName: string;
  jokerName: string | null;
  completedAt: string; // ISO
  publicUrl: string | null;
  lines: HistoryLinePayload[];
}

/**
 * Kirim satu history entry ke bot untuk langsung diposting. Gagal diam-diam
 * (cuma di-log, tidak melempar error) kalau bot sedang tidak bisa dihubungi
 * -- JANGAN sampai order gagal disimpan/diupdate di database hanya karena
 * notifikasi Discord gagal terkirim. /sync-history di bot jadi jaring
 * pengaman untuk kasus ini (lihat historySync.ts di project bot).
 */
export async function notifyHistoryPosted(payload: HistoryEntryPayload): Promise<void> {
  if (!BOT_HTTP_URL || !DISCORD_BOT_SECRET) return;

  try {
    await fetch(`${BOT_HTTP_URL}/api/history-posted`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bot-secret": DISCORD_BOT_SECRET,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    console.error("Gagal mengirim notifikasi history ke bot Discord:", err);
  }
}
