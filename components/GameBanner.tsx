import Link from "next/link";
import type { GameLite } from "@/types/game";

const BG_GRADIENT: Record<string, string> = {
  genshin: "linear-gradient(160deg, #173c68 0%, #0b1829 75%)",
  wuwa: "linear-gradient(160deg, #124d68 0%, #0b1829 75%)",
  neverness: "linear-gradient(160deg, #293b74 0%, #0b1829 75%)",
};

export function GameBanner({
  game,
  tagline,
}: {
  game: GameLite;
  tagline: string;
}) {
  const fallbackGradient = BG_GRADIENT[game.slug] ?? BG_GRADIENT.genshin;

  return (
    <Link
      href={`/joki?game=${game.slug}`}
      className="group relative rounded-[18px] p-7 overflow-hidden min-h-[170px] flex flex-col justify-end border transition-transform hover:-translate-y-1"
      style={{
        borderColor: `${game.accentColor}2E`,
      }}
    >
      {/* Layer gambar background */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
        style={{
          backgroundImage: game.bannerImage
            ? `url(${game.bannerImage})`
            : fallbackGradient,
        }}
        aria-hidden="true"
      />

      {/* Overlay gradient supaya teks tetap kebaca di atas gambar */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(0deg, #07111f 0%, rgba(7,17,31,0.85) 35%, rgba(7,17,31,0.15) 70%, rgba(7,17,31,0.4) 100%)",
        }}
        aria-hidden="true"
      />

      <p
        className="relative text-xs font-medium font-display mb-1.5"
        style={{ color: game.accentColor }}
      >
        {tagline}
      </p>
      <h3 className="relative font-display text-xl font-semibold mb-3">
        {game.name}
      </h3>
      <span className="relative text-sm text-[#C2D0E3] font-medium">
        Lihat layanan joki →
      </span>
    </Link>
  );
}