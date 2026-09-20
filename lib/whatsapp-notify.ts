/**
 * Notifikasi WhatsApp untuk customer -- SENGAJA fire-and-forget seperti
 * lib/discord-notify.ts: kalau pengiriman gagal atau provider belum
 * dikonfigurasi, order/update di website tetap harus berhasil tersimpan.
 *
 * BELUM TERSAMBUNG KE PROVIDER MANAPUN. Ini abstraction layer generic --
 * satu titik integrasi (sendWhatsappMessage di bawah) yang tinggal
 * disambungkan ke provider WhatsApp API pilihanmu (Fonnte, Wablas, Woowa,
 * dll). Semua logic "kapan harus kirim & pesan apa isinya" sudah lengkap di
 * file ini; yang belum ada cuma cara "bicara ke provider"-nya.
 *
 * Cara menyambungkan provider nanti:
 * 1. Isi implementasi di dalam sendWhatsappMessage() -- biasanya cuma
 *    fetch() ke endpoint REST provider dengan API key dari env var baru
 *    (mis. WHATSAPP_API_KEY, WHATSAPP_API_URL).
 * 2. Tidak perlu ubah apapun di lib/actions/*.ts -- semua pemanggil fungsi
 *    di file ini (notifyOrderCreatedWA, dkk) sudah terpasang dan otomatis
 *    ikut jalan begitu sendWhatsappMessage() terisi.
 */

/**
 * Normalisasi nomor WA ke format internasional (62xxx, tanpa +/spasi/dash)
 * -- kebanyakan provider WA API mengharuskan format ini. Null kalau nomor
 * kosong/tidak valid sama sekali (bukan cuma format aneh -- misal cuma
 * berisi huruf), supaya pemanggil bisa skip pengiriman dengan jelas.
 */
export function normalizeIndonesianPhoneNumber(raw: string): string | null {
  const digitsOnly = raw.replace(/[^\d]/g, "");
  if (digitsOnly.length < 8) return null;

  if (digitsOnly.startsWith("62")) return digitsOnly;
  if (digitsOnly.startsWith("0")) return `62${digitsOnly.slice(1)}`;
  // Nomor tanpa awalan 0/62 (mis. customer isi "812xxx" saja) -- anggap
  // sudah tanpa kode negara, tambahkan 62 di depan.
  return `62${digitsOnly}`;
}

/**
 * SATU-SATUNYA titik yang perlu diisi untuk menyambungkan provider WhatsApp
 * API sungguhan. Saat ini sengaja no-op (cuma log) supaya seluruh alur
 * notifikasi (toggle, pesan, pemanggilan di lib/actions/*.ts) sudah bisa
 * dites/dipakai tanpa error, tinggal isi bagian ini saat provider sudah ada.
 *
 * Return true kalau terkirim (atau dianggap terkirim), false kalau gagal --
 * pemanggil tidak throw baik true/false, murni untuk logging.
 */
async function sendWhatsappMessage(phoneNumber: string, message: string): Promise<boolean> {
  if (!process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_API_KEY) {
    console.log(
      `[whatsapp-notify] Provider belum dikonfigurasi (WHATSAPP_API_URL/WHATSAPP_API_KEY kosong). ` +
        `Pesan yang SEHARUSNYA terkirim ke ${phoneNumber}:\n${message}`
    );
    return false;
  }

  try {
    // Contoh implementasi generic (sesuaikan path/payload dengan dokumentasi
    // provider yang dipakai -- tiap provider format request-nya beda):
    //
    // const res = await fetch(process.env.WHATSAPP_API_URL, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     Authorization: `Bearer ${process.env.WHATSAPP_API_KEY}`,
    //   },
    //   body: JSON.stringify({ target: phoneNumber, message }),
    //   signal: AbortSignal.timeout(10000),
    // });
    // return res.ok;
    console.log(`[whatsapp-notify] (stub) Simulasi kirim ke ${phoneNumber}:\n${message}`);
    return true;
  } catch (err) {
    console.error("[whatsapp-notify] Gagal mengirim pesan:", err);
    return false;
  }
}

/**
 * Cek toggle & nomor customer, lalu kirim kalau memenuhi syarat. Fungsi
 * private -- dipakai oleh notifyXxxWA() di bawah, bukan dipanggil langsung
 * dari lib/actions.
 */
async function sendIfEnabled(
  customer: { whatsappNumber: string | null; whatsappNotifEnabled: boolean },
  message: string
): Promise<void> {
  if (!customer.whatsappNotifEnabled) return;
  if (!customer.whatsappNumber) return;

  const normalized = normalizeIndonesianPhoneNumber(customer.whatsappNumber);
  if (!normalized) return;

  void sendWhatsappMessage(normalized, message);
}

export interface NotifyOrderCreatedWAInput {
  customer: { whatsappNumber: string | null; whatsappNotifEnabled: boolean };
  customerName: string;
  orderCode: string;
  gameName: string;
  layanan: string;
  totalPrice: number;
  publicSlug: string;
}

export function notifyOrderCreatedWA(input: NotifyOrderCreatedWAInput): void {
  const webBaseUrl = process.env.NEXT_PUBLIC_WEB_BASE_URL || "";
  const message = [
    `Halo ${input.customerName}! 👋`,
    ``,
    `Pesanan kamu sudah kami terima:`,
    `📦 Order: #${input.orderCode}`,
    `🎮 Game: ${input.gameName}`,
    `🛠️ Layanan: ${input.layanan}`,
    `💰 Total: Rp${input.totalPrice.toLocaleString("id-ID")}`,
    ``,
    `Cek progress kapan saja di:`,
    `${webBaseUrl}/progress/${input.publicSlug}`,
    ``,
    `Terima kasih sudah pakai Shihu Service! 🙏`,
  ].join("\n");

  void sendIfEnabled(input.customer, message);
}

export interface NotifyOrderProgressWAInput {
  customer: { whatsappNumber: string | null; whatsappNotifEnabled: boolean };
  customerName: string;
  orderCode: string;
  status: string;
  progressPct: number;
  publicSlug: string;
  note?: string | null;
}

const STATUS_LABEL_WA: Record<string, string> = {
  MENUNGGU: "Menunggu giliran",
  DIKERJAKAN: "Sedang dikerjakan",
  FINISHING: "Finishing",
  SELESAI: "Selesai 🎉",
  DIBATALKAN: "Dibatalkan",
};

export function notifyOrderProgressWA(input: NotifyOrderProgressWAInput): void {
  const webBaseUrl = process.env.NEXT_PUBLIC_WEB_BASE_URL || "";
  const statusLabel = STATUS_LABEL_WA[input.status] ?? input.status;

  const lines = [
    `Halo ${input.customerName}! 👋`,
    ``,
    `Update progress order #${input.orderCode}:`,
    `📊 Status: ${statusLabel} (${input.progressPct}%)`,
  ];
  if (input.note) {
    lines.push(``, `📝 Catatan: ${input.note}`);
  }
  lines.push(``, `Lihat detail lengkap di:`, `${webBaseUrl}/progress/${input.publicSlug}`);

  void sendIfEnabled(input.customer, lines.join("\n"));
}
