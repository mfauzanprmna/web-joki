"use client";

import { useState } from "react";
import { updateExplorationProgress } from "@/lib/actions/line-progress";
import { OrderLineProgressPanel } from "./OrderLineProgressPanel";
import type { OrderLineForProgressRules } from "@/lib/order-progress-rules";

interface UpdateEntry {
  id: string;
  note: string | null;
  screenshotUrl: string | null;
  resetLocation: string | null;
  createdAt: Date;
}

interface ExplorationProgressPanelProps {
  orderLineId: string;
  title: string;
  currentPercent: number;
  jokiItem: OrderLineForProgressRules["jokiItem"];
  updates: UpdateEntry[];
}

export function ExplorationProgressPanel({
  orderLineId,
  title,
  currentPercent,
  jokiItem,
  updates,
}: ExplorationProgressPanelProps) {
  const [percent, setPercent] = useState(currentPercent);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-[#241E38] border border-shihu-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="font-display text-sm font-semibold">{title}</p>
          <span className="text-shihu-corona font-display text-sm font-bold">{percent}% dieksplor</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-shihu-border overflow-hidden mb-3">
          <div className="h-full bg-corona transition-all" style={{ width: `${percent}%` }} />
        </div>
        <form action={updateExplorationProgress} className="flex items-center gap-2">
          <input type="hidden" name="orderLineId" value={orderLineId} />
          <input
            type="range"
            min={0}
            max={100}
            value={percent}
            onChange={(e) => setPercent(Number(e.target.value))}
            className="flex-1 accent-shihu-corona"
          />
          <input
            type="number"
            name="percent"
            min={0}
            max={100}
            value={percent}
            onChange={(e) => setPercent(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
            className="admin-input !w-20 shrink-0"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-corona text-[#1A1206] text-xs font-display font-semibold shrink-0"
          >
            Simpan
          </button>
        </form>
      </div>

      <OrderLineProgressPanel orderLineId={orderLineId} jokiItem={jokiItem} updates={updates} />
    </div>
  );
}
