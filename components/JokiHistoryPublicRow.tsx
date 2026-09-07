"use client";

import { useState } from "react";
import { GameBadge } from "./GameBadge";
import { Stars } from "./Stars";
import { formatDate } from "@/lib/format";
import type { GameLite } from "@/types/game";

interface JokiHistoryPublicRowProps {
  title: string;
  customerName: string;
  completedAt: Date | string;
  rating: number | null;
  note: string | null;
  screenshotUrls: string[];
  game: GameLite;
}

export function JokiHistoryPublicRow({
  title,
  customerName,
  completedAt,
  rating,
  note,
  screenshotUrls,
  game,
}: JokiHistoryPublicRowProps) {
  const [showDetail, setShowDetail] = useState(false);
  const hasDetail = Boolean(note) || screenshotUrls.length > 0;

  return (
    <div className="bg-shihu-card border border-shihu-border rounded-2xl p-4 px-5 flex flex-col gap-3">
      <div className="flex items-center gap-4 flex-wrap">
        <div
          className="w-9.5 h-9.5 rounded-full shrink-0 flex items-center justify-center border"
          style={{
            width: 38,
            height: 38,
            borderColor: game.accentColor,
            borderWidth: 1.5,
            backgroundColor: `${game.accentColor}1F`,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={game.accentColor} strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <div className="flex-1 min-w-[180px]">
          <div className="flex gap-2 items-center mb-1 flex-wrap">
            <GameBadge game={game} />
          </div>
          <h4 className="font-display text-[14.5px] font-semibold">{title}</h4>
          <p className="text-shihu-muted text-[12.5px] mt-0.5">
            {customerName} · Selesai {formatDate(completedAt)}
          </p>
        </div>
        {rating != null && <Stars rating={rating} />}
        {hasDetail && (
          <button
            onClick={() => setShowDetail((v) => !v)}
            className="px-3 py-1.5 rounded-lg text-xs font-display font-medium border border-shihu-borderSoft text-shihu-text hover:bg-[#2C2540] shrink-0"
          >
            {showDetail ? "Tutup" : "Lihat Detail"}
          </button>
        )}
      </div>

      {showDetail && hasDetail && (
        <div className="bg-[#241E38] border border-shihu-border rounded-xl p-3.5 flex flex-col gap-3">
          {note && <p className="text-xs text-shihu-text whitespace-pre-line">{note}</p>}
          {screenshotUrls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {screenshotUrls.map((url) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt="Screenshot bukti joki"
                    className="w-20 h-20 rounded-lg object-cover border border-shihu-border hover:border-shihu-corona/50 transition-colors"
                  />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
