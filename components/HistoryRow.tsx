"use client";

import { useState } from "react";
import { GameBadge } from "./GameBadge";
import { Stars } from "./Stars";
import { OrderLineDetailPanel, type OrderLineDetail } from "./OrderLineDetailPanel";
import { formatDate } from "@/lib/format";
import type { GameLite } from "@/types/game";

interface HistoryRowProps {
  orderCode: string;
  title: string;
  customerName: string;
  completedAt: Date | string;
  rating: number | null;
  game: GameLite;
  /** Detail per item pesanan (riwayat update, screenshot, dsb). Opsional —
   * kalau kosong/tidak dikirim, tombol "Lihat Detail" tidak ditampilkan. */
  lines?: OrderLineDetail[];
}

export function HistoryRow({
  orderCode,
  title,
  customerName,
  completedAt,
  rating,
  game,
  lines = [],
}: HistoryRowProps) {
  const [showDetail, setShowDetail] = useState(false);
  const hasDetail = lines.length > 0;

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
            <span className="text-[11.5px] text-shihu-faint font-display">
              {orderCode}
            </span>
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
        <div className="flex flex-col gap-2.5">
          {lines.map((line) => (
            <OrderLineDetailPanel key={line.id} line={line} />
          ))}
        </div>
      )}
    </div>
  );
}
