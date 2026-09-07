import { GameBadge } from "./GameBadge";
import { RingProgress } from "./RingProgress";
import { STATUS_LABEL } from "@/types/game";
import type { GameLite } from "@/types/game";

interface QueueRowProps {
  orderCode: string;
  title: string;
  customerName: string;
  jokerName: string | null;
  status: string;
  progressPct: number;
  game: GameLite;
}

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  FINISHING: { bg: "#4CD97D18", text: "#4CD97D" },
  SELESAI: { bg: "#4CD97D18", text: "#4CD97D" },
  MENUNGGU: { bg: "#B7ADD118", text: "#B7ADD1" },
  DIBATALKAN: { bg: "#E2504A18", text: "#E2504A" },
};

export function QueueRow({
  orderCode,
  title,
  customerName,
  jokerName,
  status,
  progressPct,
  game,
}: QueueRowProps) {
  const style = STATUS_STYLE[status] ?? {
    bg: `${game.accentColor}18`,
    text: game.accentColor,
  };

  return (
    <div className="bg-shihu-card border border-shihu-border rounded-2xl p-5 flex items-center gap-4.5 flex-wrap">
      <RingProgress value={progressPct} accent={game.accentColor} />
      <div className="flex-1 min-w-[180px]">
        <div className="flex gap-2 items-center mb-1.5 flex-wrap">
          <span className="text-[11.5px] text-shihu-faint font-display">
            {orderCode}
          </span>
          <GameBadge game={game} />
        </div>
        <h4 className="font-display text-[15px] font-semibold mb-1">{title}</h4>
        <p className="text-shihu-muted text-[12.5px]">
          Pemesan: {customerName} · Joki: {jokerName ?? "Belum ditugaskan"}
        </p>
      </div>
      <span
        className="px-3.5 py-1.5 rounded-full font-display text-xs font-medium whitespace-nowrap"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        {STATUS_LABEL[status] ?? status}
      </span>
    </div>
  );
}
