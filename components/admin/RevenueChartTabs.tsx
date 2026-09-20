"use client";

import { useState } from "react";
import { RevenueBarChart } from "./RevenueBarChart";
import { formatRupiah } from "@/lib/format";
import type { DailyRevenuePoint, MonthlyRevenuePoint } from "@/lib/analytics";

export function RevenueChartTabs({
  daily,
  monthly,
}: {
  daily: DailyRevenuePoint[];
  monthly: MonthlyRevenuePoint[];
}) {
  const [mode, setMode] = useState<"daily" | "monthly">("daily");

  const points = mode === "daily" ? daily : monthly;
  const totalInView = points.reduce((sum, p) => sum + p.revenue, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-shihu-faint text-xs">
          Total periode ini: <span className="text-shihu-corona font-semibold">{formatRupiah(totalInView)}</span>
        </p>
        <div className="flex gap-1 bg-shihu-bg rounded-lg p-1">
          <button
            type="button"
            onClick={() => setMode("daily")}
            className={`px-3 py-1 rounded-md text-xs font-display font-medium transition-colors ${
              mode === "daily" ? "bg-shihu-corona text-[#1A1206]" : "text-shihu-muted hover:text-shihu-text"
            }`}
          >
            30 hari
          </button>
          <button
            type="button"
            onClick={() => setMode("monthly")}
            className={`px-3 py-1 rounded-md text-xs font-display font-medium transition-colors ${
              mode === "monthly" ? "bg-shihu-corona text-[#1A1206]" : "text-shihu-muted hover:text-shihu-text"
            }`}
          >
            12 bulan
          </button>
        </div>
      </div>

      <RevenueBarChart
        points={points.map((p) => ({
          label: p.label,
          value: p.revenue,
          secondaryValue: p.orderCount,
          secondaryLabel: "Order",
        }))}
        valueFormatter={formatRupiah}
      />
    </div>
  );
}
