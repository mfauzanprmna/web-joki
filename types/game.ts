export type GameSlug = "genshin" | "wuwa" | "neverness";

export type GameLite = {
  slug: string;
  name: string;
  accentColor: string;
  bannerImage?: string; // path ke gambar, misal "/games/genshin-banner.jpg"
};

export const STATUS_LABEL: Record<string, string> = {
  MENUNGGU: "Menunggu giliran",
  DIKERJAKAN: "Sedang dikerjakan",
  FINISHING: "Finishing",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
};

export const STATUS_TONE: Record<string, "muted" | "accent" | "success" | "danger"> = {
  MENUNGGU: "muted",
  DIKERJAKAN: "accent",
  FINISHING: "success",
  SELESAI: "success",
  DIBATALKAN: "danger",
};
