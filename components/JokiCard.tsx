import { GameBadge } from "./GameBadge";
import type { GameLite } from "@/types/game";

interface JokiCardProps {
  title: string;
  description: string;
  priceLabel: string;
  etaLabel: string;
  badge?: string | null;
  game: GameLite;
  metaTags: (string | null | undefined)[];
}

export function JokiCard({
  title,
  description,
  priceLabel,
  etaLabel,
  badge,
  game,
  metaTags,
}: JokiCardProps) {
  const tags = metaTags.filter((t): t is string => !!t);

  return (
    <div className="bg-shihu-card border border-shihu-border rounded-2xl p-5">
      <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
        <GameBadge game={game} />
        {badge && (
          <span
            className="text-[10.5px] font-semibold px-2 py-0.5 rounded-md font-display"
            style={{ backgroundColor: "#FFB23818", color: "#FFB238" }}
          >
            {badge}
          </span>
        )}
      </div>
      <h4 className="font-display text-base font-semibold mb-1.5">{title}</h4>
      <p className="text-shihu-muted text-[13px] mb-3 leading-relaxed">
        {description}
      </p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {tags.map((tag) => (
          <span
            key={tag}
            className="text-[10.5px] px-2 py-0.5 rounded-md bg-[#2C2540] text-shihu-muted font-display"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between pt-3.5 border-t border-shihu-border">
        <div>
          <p
            className="font-display text-[17px] font-bold"
            style={{ color: game.accentColor }}
          >
            {priceLabel}
          </p>
          <p className="text-[11.5px] text-shihu-faint mt-0.5">
            Estimasi {etaLabel}
          </p>
        </div>
        <button className="px-4 py-2.5 rounded-xl font-display font-semibold text-[13px] text-[#1A1206] bg-corona">
          Order
        </button>
      </div>
    </div>
  );
}
