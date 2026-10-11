import {
  FaDiscord,
  FaTiktok,
  FaInstagram,
  FaWhatsapp,
  FaYoutube,
  FaFacebook,
  FaXTwitter,
  FaTelegram,
  FaEnvelope,
  FaGlobe,
  FaLink,
} from "react-icons/fa6";
import type { IconType } from "react-icons";

const ICONS: Record<string, IconType> = {
  discord: FaDiscord,
  tiktok: FaTiktok,
  instagram: FaInstagram,
  whatsapp: FaWhatsapp,
  youtube: FaYoutube,
  facebook: FaFacebook,
  x: FaXTwitter,
  telegram: FaTelegram,
  email: FaEnvelope,
  website: FaGlobe,
  link: FaLink,
};

/**
 * Ikon link kontak. Kalau logoUrl diisi, gambar itu yang dipakai
 * (menggantikan ikon preset); kalau tidak, pakai ikon preset sesuai `icon`
 * (fallback ke ikon link umum kalau kuncinya tidak dikenal, mis. ikon yang
 * sudah dihapus dari daftar preset tapi datanya masih ada di database).
 */
export function ContactIcon({
  icon,
  logoUrl,
  size = 16,
  className = "",
}: {
  icon: string;
  logoUrl?: string | null;
  size?: number;
  className?: string;
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        width={size}
        height={size}
        className={`object-contain ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  const Icon = ICONS[icon] ?? FaLink;
  return <Icon size={size} className={className} aria-hidden="true" />;
}
