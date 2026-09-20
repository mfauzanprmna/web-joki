"use client";

import { useState } from "react";

export interface BarChartPoint {
  label: string;
  value: number;
  /** Nilai sekunder untuk ditampilkan di tooltip (mis. jumlah order). */
  secondaryValue?: number;
  secondaryLabel?: string;
}

/**
 * Bar chart minimal berbasis SVG murni -- tanpa dependency chart library
 * eksternal, supaya bundle tetap ringan (lihat catatan optimasi performa
 * sebelumnya). Cukup untuk kebutuhan tren harian/bulanan di dashboard
 * analitik; bukan pengganti chart library kalau nanti butuh visualisasi
 * yang jauh lebih kompleks.
 */
export function RevenueBarChart({
  points,
  valueFormatter,
  color = "#4FC3F7",
}: {
  points: BarChartPoint[];
  valueFormatter: (value: number) => string;
  color?: string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const maxValue = Math.max(1, ...points.map((p) => p.value));
  const barWidth = 100 / points.length;

  return (
    <div className="relative">
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-40 overflow-visible">
        {points.map((p, i) => {
          const heightPct = (p.value / maxValue) * 100;
          const barHeight = (heightPct / 100) * 36; // sisakan 4 unit untuk padding atas
          const x = i * barWidth;
          const isHovered = hoverIndex === i;
          return (
            <rect
              key={i}
              x={x + barWidth * 0.15}
              y={40 - barHeight}
              width={barWidth * 0.7}
              height={Math.max(barHeight, p.value > 0 ? 0.5 : 0)}
              rx={0.8}
              fill={color}
              opacity={isHovered ? 1 : 0.75}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              style={{ cursor: "pointer", transition: "opacity 0.12s" }}
            />
          );
        })}
      </svg>

      {hoverIndex !== null && points[hoverIndex] && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full bg-shihu-bg border border-shihu-border rounded-lg px-3 py-2 text-xs font-display shadow-lg pointer-events-none whitespace-nowrap z-10">
          <p className="text-shihu-faint mb-0.5">{points[hoverIndex].label}</p>
          <p className="font-semibold text-shihu-corona">{valueFormatter(points[hoverIndex].value)}</p>
          {points[hoverIndex].secondaryValue != null && (
            <p className="text-shihu-muted mt-0.5">
              {points[hoverIndex].secondaryLabel ?? "Order"}: {points[hoverIndex].secondaryValue}
            </p>
          )}
        </div>
      )}

      <div className="flex mt-2">
        {points.map((p, i) => (
          <div
            key={i}
            className="text-center"
            style={{ width: `${barWidth}%` }}
          >
            {(points.length <= 14 || i % Math.ceil(points.length / 14) === 0) && (
              <span className="text-[9.5px] text-shihu-faint font-display">{p.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
