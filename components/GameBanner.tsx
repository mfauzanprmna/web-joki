import Link from "next/link";
import type { GameLite } from "@/types/game";

const BG_GRADIENT: Record<string, string> = {
  genshin: "linear-gradient(160deg, #3a2c14 0%, #15111f 75%)",
  wuwa: "linear-gradient(160deg, #123138 0%, #15111f 75%)",
  neverness: "linear-gradient(160deg, #281c42 0%, #15111f 75%)",
};

export function GameBanner({
  game,
  tagline,
}: {
  game: GameLite;
  tagline: string;
}) {
  const bg = BG_GRADIENT[game.slug] ?? BG_GRADIENT.genshin;

  return (
    <Link
      href={`/joki?game=${game.slug}`}
      className="group relative rounded-[18px] p-7 overflow-hidden min-h-[170px] flex flex-col justify-end border transition-transform hover:-translate-y-1"
      style={{
        background: bg,
        borderColor: `${game.accentColor}2E`,
      }}
    >
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-30 border"
        style={{ borderColor: game.accentColor, borderWidth: 1.5 }}
        aria-hidden="true"
      />
      <div
        className="absolute -top-2 -right-2 w-[90px] h-[90px] rounded-full bg-shihu-bg border"
        style={{ borderColor: `${game.accentColor}55`, borderWidth: 1.5 }}
        aria-hidden="true"
      />
      <p
        className="text-xs font-medium font-display mb-1.5"
        style={{ color: game.accentColor }}
      >
        {tagline}
      </p>
      <h3 className="font-display text-xl font-semibold mb-3">{game.name}</h3>
      <span className="text-sm text-[#C9C5D6] font-medium">
        Lihat layanan joki →
      </span>
    </Link>
  );
}
