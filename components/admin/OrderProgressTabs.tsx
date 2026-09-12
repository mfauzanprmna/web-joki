"use client";

import { useMemo, useState } from "react";
import { OrderLineProgressPanel } from "./OrderLineProgressPanel";
import { ExplorationProgressPanel } from "./ExplorationProgressPanel";
import { CountProgressPanel } from "./CountProgressPanel";
import { RawatAkunProgressPanel, type DayProgressItem, type DayTaskItem } from "./RawatAkunProgressPanel";
import {
  groupLinesByCategory,
  getPaketLines,
  getLineProgressTarget,
  getCategoryKind,
  type LineForGrouping,
} from "@/lib/order-progress-grouping";

interface UpdateEntry {
  id: string;
  note: string | null;
  screenshotUrl: string | null;
  resetLocation: string | null;
  createdAt: Date;
}

interface PaketItemLine {
  id: string;
  title: string;
  actFrom: number | null;
  actTo: number | null;
  jokiItem: NonNullable<OrderLineData["jokiItem"]>;
}

interface PaketBreakdownItem {
  id: string;
  title: string;
  categoryLabel: string;
}

export interface OrderLineData extends LineForGrouping {
  title: string;
  jokiItem:
  | {
    category: {
      isRawatAkun: boolean;
      requiresRegion: boolean;
      requiresQuestType: boolean;
      isMaterial: boolean;
    };
    region: { name: string } | null;
    questType: { name: string; questKind: string } | null;
    endgameContent: { endgameContent: { resetCycle: string } }[];
  }
  | null;
  actFrom: number | null;
  actTo: number | null;
  materialQuantity: number | null;
  progressPercent: number | null;
  progressCurrent: number | null;
  updates: UpdateEntry[];
  rawatAkun: { days: DayProgressItem[]; tasks: DayTaskItem[] } | null;
  paketBreakdown: PaketBreakdownItem[];
  paketItems: PaketItemLine[];
  progressLineId?: string;
}

function LinePanel({ line }: { line: OrderLineData }) {
  const kind = getCategoryKind(line);
  const progressLineId = line.progressLineId ?? line.id;

  if (kind === "RAWAT_AKUN" && line.rawatAkun) {
    return <RawatAkunProgressPanel orderLineId={progressLineId} days={line.rawatAkun.days} tasks={line.rawatAkun.tasks} />;
  }

  if (kind === "EKSPLORASI") {
    return (
      <ExplorationProgressPanel
        orderLineId={progressLineId}
        title={line.title}
        currentPercent={line.progressPercent ?? 0}
        jokiItem={line.jokiItem}
        updates={line.updates}
      />
    );
  }

  if (kind === "QUEST" || kind === "MATERIAL") {
    const target = getLineProgressTarget(line);
    return (
      <CountProgressPanel
        orderLineId={progressLineId}
        title={line.title}
        currentCount={line.progressCurrent ?? 0}
        target={target}
        unitLabel={kind === "QUEST" ? "Act" : "item"}
        jokiItem={line.jokiItem}
        updates={line.updates}
      />
    );
  }

  return <OrderLineProgressPanel orderLineId={progressLineId} jokiItem={line.jokiItem} updates={line.updates} />;
}

/** Konten tab Paket: breakdown isi paket per kategori (read-only) + 1 form update biasa. */
function PaketPanel({ line }: { line: OrderLineData }) {
  const byCategory = useMemo(() => {
    const map = new Map<string, PaketBreakdownItem[]>();
    for (const item of line.paketBreakdown) {
      if (!map.has(item.categoryLabel)) map.set(item.categoryLabel, []);
      map.get(item.categoryLabel)!.push(item);
    }
    return Array.from(map.entries());
  }, [line.paketBreakdown]);

  const itemLines: OrderLineData[] = line.paketItems.map((item) => ({
    id: `${line.id}:${item.id}`,
    jokiPaketId: null,
    title: item.title,
    jokiItem: item.jokiItem,
    actFrom: item.actFrom,
    actTo: item.actTo,
    materialQuantity: line.materialQuantity,
    progressPercent: line.progressPercent,
    progressCurrent: line.progressCurrent,
    updates: line.updates,
    rawatAkun: line.rawatAkun,
    paketBreakdown: [],
    paketItems: [],
    progressLineId: line.id,
  }));

  return (
    <div className="flex flex-col gap-4">
      {byCategory.length > 0 && (
        <div className="bg-[#241E38] border border-shihu-border rounded-xl p-4">
          <p className="font-display text-xs font-semibold text-shihu-muted mb-2.5">Isi paket ini</p>
          <div className="flex flex-col gap-2.5">
            {byCategory.map(([categoryLabel, items]) => (
              <div key={categoryLabel}>
                <p className="text-[11px] text-shihu-corona font-display font-medium mb-1">{categoryLabel}</p>
                <ul className="flex flex-col gap-0.5">
                  {items.map((it) => (
                    <li key={it.id} className="text-[12.5px] text-shihu-text">
                      • {it.title}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
      {itemLines.length > 0 ? <CategoryTabs lines={itemLines} /> : (
        <OrderLineProgressPanel orderLineId={line.id} jokiItem={line.jokiItem} updates={line.updates} />
      )}
    </div>
  );
}

/** Level 1 + level 2 tabs untuk baris non-Paket, dikelompokkan per kategori. */
function CategoryTabs({ lines }: { lines: OrderLineData[] }) {
  const groups = useMemo(() => groupLinesByCategory(lines), [lines]);
  const [activeGroupIdx, setActiveGroupIdx] = useState(0);
  const [activeSubIdx, setActiveSubIdx] = useState(0);

  if (groups.length === 0) return null;

  const activeGroup = groups[Math.min(activeGroupIdx, groups.length - 1)];
  const activeSub = activeGroup.subGroups[Math.min(activeSubIdx, activeGroup.subGroups.length - 1)];

  function selectGroup(i: number) {
    setActiveGroupIdx(i);
    setActiveSubIdx(0);
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.length > 1 && (
        <div className="flex gap-1.5 flex-wrap">
          {groups.map((g, i) => (
            <button
              key={g.kind}
              onClick={() => selectGroup(i)}
              className="px-3.5 py-2 rounded-xl font-display text-xs font-medium transition-colors"
              style={{
                backgroundColor: activeGroupIdx === i ? "#2C2540" : "transparent",
                color: activeGroupIdx === i ? "#FFB238" : "#B7ADD1",
                border: `1px solid ${activeGroupIdx === i ? "#FFB23855" : "#3D3557"}`,
              }}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}

      {activeGroup.hasSubTabs && (
        <div className="flex gap-1.5 flex-wrap pl-1">
          {activeGroup.subGroups.map((sg, i) => (
            <button
              key={sg.key}
              onClick={() => setActiveSubIdx(i)}
              className="px-3 py-1.5 rounded-lg font-display text-[11.5px] font-medium transition-colors"
              style={{
                backgroundColor: activeSubIdx === i ? "#241E38" : "transparent",
                color: activeSubIdx === i ? "#FFB238" : "#867BA0",
                border: `1px solid ${activeSubIdx === i ? "#FFB23855" : "#362D4C"}`,
              }}
            >
              {sg.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {activeSub.lines.map((line) => (
          <div key={line.id}>
            {activeSub.lines.length > 1 && (
              <p className="font-display text-xs font-semibold text-shihu-muted mb-2">{line.title}</p>
            )}
            <LinePanel line={line} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrderProgressTabs({ lines }: { lines: OrderLineData[] }) {
  const paketLines = useMemo(() => getPaketLines(lines), [lines]);
  const categoryLines = useMemo(() => lines.filter((l) => !l.jokiPaketId), [lines]);

  const topTabs = useMemo(
    () => [
      ...(categoryLines.length > 0 ? [{ key: "__categories__", label: null as string | null }] : []),
      ...paketLines.map((p) => ({ key: p.id, label: p.title as string | null })),
    ],
    [categoryLines, paketLines]
  );

  const [activeTopIdx, setActiveTopIdx] = useState(0);

  if (lines.length === 0) {
    return <p className="text-shihu-muted text-sm">Tidak ada item dalam pesanan ini.</p>;
  }

  if (topTabs.length <= 1) {
    if (paketLines.length === 1 && categoryLines.length === 0) {
      return (
        <div>
          <p className="font-display text-sm font-semibold mb-3">{paketLines[0].title}</p>
          <PaketPanel line={paketLines[0]} />
        </div>
      );
    }
    return <CategoryTabs lines={categoryLines} />;
  }

  const active = topTabs[activeTopIdx];

  return (
    <div>
      <div className="flex gap-1.5 flex-wrap mb-4">
        {topTabs.map((tab, i) => (
          <button
            key={tab.key}
            onClick={() => setActiveTopIdx(i)}
            className="px-3.5 py-2 rounded-xl font-display text-xs font-medium transition-colors max-w-[220px] truncate"
            style={{
              backgroundColor: activeTopIdx === i ? "#2C2540" : "transparent",
              color: activeTopIdx === i ? "#FFB238" : "#B7ADD1",
              border: `1px solid ${activeTopIdx === i ? "#FFB23855" : "#3D3557"}`,
            }}
            title={tab.label ?? "Item"}
          >
            {tab.label ?? "Item"}
          </button>
        ))}
      </div>

      {active.key === "__categories__" ? (
        <CategoryTabs lines={categoryLines} />
      ) : (
        <PaketPanel line={paketLines.find((p) => p.id === active.key)!} />
      )}
    </div>
  );
}