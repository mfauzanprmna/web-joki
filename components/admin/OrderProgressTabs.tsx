"use client";

import { useState } from "react";
import { OrderLineProgressPanel } from "./OrderLineProgressPanel";
import { RawatAkunProgressPanel, type DayProgressItem, type DayTaskItem } from "./RawatAkunProgressPanel";
import type { OrderLineForProgressRules } from "@/lib/order-progress-rules";

interface OrderLineData {
  id: string;
  title: string;
  jokiItem: OrderLineForProgressRules["jokiItem"];
  updates: {
    id: string;
    note: string | null;
    screenshotUrl: string | null;
    resetLocation: string | null;
    createdAt: Date;
  }[];
  rawatAkun: { days: DayProgressItem[]; tasks: DayTaskItem[] } | null;
}

function LinePanel({ line }: { line: OrderLineData }) {
  if (line.rawatAkun) {
    return <RawatAkunProgressPanel orderLineId={line.id} days={line.rawatAkun.days} tasks={line.rawatAkun.tasks} />;
  }
  return <OrderLineProgressPanel orderLineId={line.id} jokiItem={line.jokiItem} updates={line.updates} />;
}

export function OrderProgressTabs({ lines }: { lines: OrderLineData[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (lines.length === 0) {
    return <p className="text-shihu-muted text-sm">Tidak ada item dalam pesanan ini.</p>;
  }

  if (lines.length === 1) {
    return (
      <div>
        <p className="font-display text-sm font-semibold mb-3">{lines[0].title}</p>
        <LinePanel line={lines[0]} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-1.5 flex-wrap mb-4">
        {lines.map((line, i) => (
          <button
            key={line.id}
            onClick={() => setActiveIndex(i)}
            className="px-3.5 py-2 rounded-xl font-display text-xs font-medium transition-colors max-w-[220px] truncate"
            style={{
              backgroundColor: activeIndex === i ? "#2C2540" : "transparent",
              color: activeIndex === i ? "#FFB238" : "#B7ADD1",
              border: `1px solid ${activeIndex === i ? "#FFB23855" : "#3D3557"}`,
            }}
            title={line.title}
          >
            {line.title}
          </button>
        ))}
      </div>

      {lines.map((line, i) => (
        <div key={line.id} style={{ display: activeIndex === i ? "block" : "none" }}>
          <LinePanel line={line} />
        </div>
      ))}
    </div>
  );
}
