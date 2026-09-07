import type { GameLite } from "@/types/game";

export function GameBadge({
  game,
  size = "sm",
}: {
  game: GameLite;
  size?: "sm" | "md";
}) {
  const pad = size === "sm" ? "px-2.5 py-1" : "px-3 py-1.5";
  const fs = size === "sm" ? "text-[11px]" : "text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-display font-medium ${pad} ${fs}`}
      style={{
        backgroundColor: `${game.accentColor}1F`,
        color: game.accentColor,
        border: `1px solid ${game.accentColor}55`,
      }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: game.accentColor }}
        aria-hidden="true"
      />
      {game.name}
    </span>
  );
}
