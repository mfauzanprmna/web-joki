import { Stars } from "./Stars";
import type { GameLite } from "@/types/game";
import { formatDate } from "@/lib/format";

interface TestimoniCardProps {
  customerName: string;
  message: string;
  rating: number;
  game: GameLite;
  jokiTitle?: string;
  completedAt?: Date | string;
}

export function TestimoniCard({
  customerName,
  message,
  rating,
  game,
  jokiTitle,
  completedAt,
}: TestimoniCardProps) {
  return (
    <div className="bg-shihu-card border border-shihu-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8.5 h-8.5 rounded-full flex items-center justify-center font-display text-[13px] font-semibold border"
            style={{
              width: 34,
              height: 34,
              backgroundColor: `${game.accentColor}1F`,
              borderColor: `${game.accentColor}55`,
              color: game.accentColor,
            }}
          >
            {customerName.charAt(0)}
          </div>
          <div>
            <p className="font-display text-sm font-semibold">{customerName}</p>
            <p className="text-[11px] text-shihu-faint">{game.name}</p>
            {jokiTitle && <p className="text-[11px] text-shihu-corona mt-0.5">{jokiTitle}</p>}
            {completedAt && <p className="text-[11px] text-shihu-faint mt-0.5">Selesai {formatDate(completedAt)}</p>}
          </div>
        </div>
        <Stars rating={rating} />
      </div>
      <p className="text-[#B8B4C6] text-[13.5px] leading-relaxed italic">
        &ldquo;{message}&rdquo;
      </p>
    </div>
  );
}
