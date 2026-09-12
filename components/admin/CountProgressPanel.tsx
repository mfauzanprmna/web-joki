"use client";

import { useState } from "react";
import { updateCountProgress } from "@/lib/actions/line-progress";
import { OrderLineProgressPanel } from "./OrderLineProgressPanel";
import type { OrderLineForProgressRules } from "@/lib/order-progress-rules";

interface UpdateEntry {
  id: string;
  note: string | null;
  screenshotUrl: string | null;
  resetLocation: string | null;
  createdAt: Date;
}

interface CountProgressPanelProps {
  orderLineId: string;
  title: string;
  currentCount: number;
  target: number | null;
  unitLabel: string; // mis. "Act" atau "material"
  jokiItem: OrderLineForProgressRules["jokiItem"];
  updates: UpdateEntry[];
}

export function CountProgressPanel({
  orderLineId,
  title,
  currentCount,
  target,
  unitLabel,
  jokiItem,
  updates,
}: CountProgressPanelProps) {
  const [current, setCurrent] = useState(currentCount);
  const percent = target && target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-[#241E38] border border-shihu-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="font-display text-sm font-semibold">{title}</p>
          <span className="text-shihu-corona font-display text-sm font-bold">
            {current} / {target ?? "?"} {unitLabel}
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-shihu-border overflow-hidden mb-3">
          <div className="h-full bg-corona transition-all" style={{ width: `${percent}%` }} />
        </div>
        {target == null ? (
          <p className="text-[11.5px] text-red-400">
            Target belum jelas -- lengkapi Act dari/sampai atau jumlah material di baris order ini dulu.
          </p>
        ) : (
          <form action={updateCountProgress} className="flex items-center gap-2">
            <input type="hidden" name="orderLineId" value={orderLineId} />
            <input type="hidden" name="target" value={target} />
            <input
              type="range"
              min={0}
              max={target}
              value={current}
              onChange={(e) => setCurrent(Number(e.target.value))}
              className="flex-1 accent-shihu-corona"
            />
            <input
              type="number"
              name="current"
              min={0}
              max={target}
              value={current}
              onChange={(e) => setCurrent(Math.max(0, Math.min(target, Number(e.target.value) || 0)))}
              className="admin-input !w-20 shrink-0"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-corona text-[#1A1206] text-xs font-display font-semibold shrink-0"
            >
              Simpan
            </button>
          </form>
        )}
      </div>

      <OrderLineProgressPanel orderLineId={orderLineId} jokiItem={jokiItem} updates={updates} />
    </div>
  );
}
