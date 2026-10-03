"use client";

import { useMemo, useState, useTransition } from "react";
import { OrderLineProgressPanel } from "./OrderLineProgressPanel";
import { ExplorationProgressPanel } from "./ExplorationProgressPanel";
import { CountProgressPanel } from "./CountProgressPanel";
import { RawatAkunProgressPanel, type DayProgressItem, type DayTaskItem } from "./RawatAkunProgressPanel";
import { toggleOrderLineCompletion } from "@/lib/actions/line-progress";
import {
  groupLinesByCategory,
  groupPaketItemsByCategory,
  groupPaketPurchases,
  getLineProgressTarget,
  getCategoryKind,
  getJokiItemCategoryLabel,
  type LineForGrouping,
} from "@/lib/order-progress-grouping";

interface UpdateEntry {
  id: string;
  note: string | null;
  screenshotUrl: string | null;
  resetLocation: string | null;
  createdAt: Date;
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
  patchEvent: { title: string } | null;
  endgameContent: { title: string } | null;
  actFrom: number | null;
  actTo: number | null;
  materialQuantity: number | null;
  progressPercent: number | null;
  progressCurrent: number | null;
  isCompleted: boolean;
  updates: UpdateEntry[];
  rawatAkun: { days: DayProgressItem[]; tasks: DayTaskItem[] } | null;
}

function LinePanel({ line }: { line: OrderLineData }) {
  const kind = getCategoryKind(line);
  const [togglePending, startToggleTransition] = useTransition();
  const panel = kind === "RAWAT_AKUN" && line.rawatAkun
    ? <RawatAkunProgressPanel orderLineId={line.id} days={line.rawatAkun.days} tasks={line.rawatAkun.tasks} />
    : kind === "EKSPLORASI"
      ? <ExplorationProgressPanel orderLineId={line.id} title={line.title} currentPercent={line.progressPercent ?? 0} jokiItem={line.jokiItem} updates={line.updates} />
      : kind === "QUEST" || kind === "MATERIAL"
        ? <CountProgressPanel orderLineId={line.id} title={line.title} currentCount={line.progressCurrent ?? 0} target={getLineProgressTarget(line)} unitLabel={kind === "QUEST" ? "Act" : "item"} jokiItem={line.jokiItem} updates={line.updates} />
        : <OrderLineProgressPanel orderLineId={line.id} jokiItem={line.jokiItem} updates={line.updates} />;

  return (
    <div className="flex flex-col gap-3">
      <form
        action={(formData) => {
          startToggleTransition(async () => {
            await toggleOrderLineCompletion(formData);
          });
        }}
        className="flex items-center justify-between gap-3 bg-[rgb(var(--admin-panel))] border border-shihu-border rounded-xl p-3.5"
      >
        <div>
          <p className="font-display text-xs font-semibold">Status item</p>
          <p className="text-[11px] text-shihu-faint">Tandai selesai jika joki item ini sudah rampung.</p>
        </div>
        <input type="hidden" name="orderLineId" value={line.id} />
        <input type="hidden" name="isCompleted" value={String(!line.isCompleted)} />
        <button
          type="submit"
          disabled={togglePending}
          aria-busy={togglePending}
          className={`px-3.5 py-2 rounded-lg text-xs font-display font-semibold shrink-0 disabled:opacity-60 ${line.isCompleted ? "border border-shihu-borderSoft text-shihu-muted" : "bg-corona text-[#1A1206]"}`}
        >
          {togglePending ? "Menyimpan..." : line.isCompleted ? "Batalkan selesai" : "Tandai selesai"}
        </button>
      </form>
      {panel}
    </div>
  );
}

/** Konten tab Paket: breakdown isi paket per kategori (read-only) + progress
 * per item isinya -- tiap item sekarang OrderLine SENDIRI (bukan lagi 1
 * baris gabungan yang dipecah semu di client), jadi progress/update/status
 * selesainya benar-benar tersimpan terpisah per item. */
function PaketPanel({ title, lines }: { title: string; lines: OrderLineData[] }) {
  const byCategory = useMemo(() => {
    const map = new Map<string, { id: string; title: string }[]>();
    for (const item of lines) {
      const label = item.jokiItem ? getJokiItemCategoryLabel(item.jokiItem) : "Lainnya";
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push({ id: item.id, title: item.title });
    }
    return Array.from(map.entries());
  }, [lines]);

  return (
    <div className="flex flex-col gap-4">
      <p className="font-display text-sm font-semibold">{title}</p>

      {byCategory.length > 0 && (
        <div className="bg-[rgb(var(--admin-panel))] border border-shihu-border rounded-xl p-4">
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

      <CategoryTabs lines={lines} includePaketLines />
    </div>
  );
}

/** Level 1 + level 2 tabs. `includePaketLines` dipakai di dalam satu tab
 * Paket (lines yang masuk sudah pasti isi paket, jadi TIDAK boleh
 * dikeluarkan lagi seperti pada pengelompokan top-level non-paket). */
function CategoryTabs({ lines, includePaketLines = false }: { lines: OrderLineData[]; includePaketLines?: boolean }) {
  const groups = useMemo(
    () => (includePaketLines ? groupPaketItemsByCategory(lines) : groupLinesByCategory(lines)),
    [lines, includePaketLines]
  );
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
                backgroundColor: activeGroupIdx === i ? "rgb(var(--admin-panel-soft))" : "transparent",
                color: activeGroupIdx === i ? "rgb(var(--admin-accent))" : "rgb(var(--admin-muted))",
                border: `1px solid ${activeGroupIdx === i ? "rgb(var(--admin-accent) / 0.33)" : "rgb(var(--admin-border))"}`,
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
                backgroundColor: activeSubIdx === i ? "rgb(var(--admin-panel))" : "transparent",
                color: activeSubIdx === i ? "rgb(var(--admin-accent))" : "rgb(var(--admin-muted))",
                border: `1px solid ${activeSubIdx === i ? "rgb(var(--admin-accent) / 0.33)" : "rgb(var(--admin-border))"}`,
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
            {(activeSub.lines.length > 1 || activeGroup.kind === "EVENT" || activeGroup.kind === "ENDGAME") && (
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
  const paketGroups = useMemo(() => groupPaketPurchases(lines), [lines]);
  const categoryLines = useMemo(() => lines.filter((l) => !l.jokiPaketId), [lines]);

  const topTabs = useMemo(
    () => [
      ...(categoryLines.length > 0 ? [{ key: "__categories__", label: null as string | null }] : []),
      ...paketGroups.map((g) => ({ key: g.key, label: g.title as string | null })),
    ],
    [categoryLines, paketGroups]
  );

  const [activeTopIdx, setActiveTopIdx] = useState(0);

  if (lines.length === 0) {
    return <p className="text-shihu-muted text-sm">Tidak ada item dalam pesanan ini.</p>;
  }

  if (topTabs.length <= 1) {
    if (paketGroups.length === 1 && categoryLines.length === 0) {
      return <PaketPanel title={paketGroups[0].title} lines={paketGroups[0].lines} />;
    }
    return <CategoryTabs lines={categoryLines} />;
  }

  const active = topTabs[activeTopIdx];
  const activeGroup = paketGroups.find((g) => g.key === active.key);

  return (
    <div>
      <div className="flex gap-1.5 flex-wrap mb-4">
        {topTabs.map((tab, i) => (
          <button
            key={tab.key}
            onClick={() => setActiveTopIdx(i)}
            className="px-3.5 py-2 rounded-xl font-display text-xs font-medium transition-colors max-w-[220px] truncate"
            style={{
              backgroundColor: activeTopIdx === i ? "rgb(var(--admin-panel-soft))" : "transparent",
              color: activeTopIdx === i ? "rgb(var(--admin-accent))" : "rgb(var(--admin-muted))",
              border: `1px solid ${activeTopIdx === i ? "rgb(var(--admin-accent) / 0.33)" : "rgb(var(--admin-border))"}`,
            }}
            title={tab.label ?? "Item"}
          >
            {tab.label ?? "Item"}
          </button>
        ))}
      </div>

      {active.key === "__categories__" ? (
        <CategoryTabs lines={categoryLines} />
      ) : activeGroup ? (
        <PaketPanel title={activeGroup.title} lines={activeGroup.lines} />
      ) : null}
    </div>
  );
}