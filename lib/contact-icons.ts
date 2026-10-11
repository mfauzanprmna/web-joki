/**
 * Daftar ikon preset untuk link kontak. Cuma berisi kunci & label (tanpa
 * import react-icons) supaya aman dipakai di server action untuk validasi
 * -- komponen yang merender ikonnya ada di components/ContactIcon.tsx.
 */
export const CONTACT_ICON_OPTIONS = [
  { key: "discord", label: "Discord" },
  { key: "tiktok", label: "TikTok" },
  { key: "instagram", label: "Instagram" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "youtube", label: "YouTube" },
  { key: "facebook", label: "Facebook" },
  { key: "x", label: "X (Twitter)" },
  { key: "telegram", label: "Telegram" },
  { key: "email", label: "Email" },
  { key: "website", label: "Website" },
  { key: "link", label: "Link umum" },
] as const;

export type ContactIconKey = (typeof CONTACT_ICON_OPTIONS)[number]["key"];

export const CONTACT_ICON_KEYS: readonly string[] = CONTACT_ICON_OPTIONS.map((o) => o.key);
