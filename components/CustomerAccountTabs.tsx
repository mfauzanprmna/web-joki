"use client";

import { useMemo, useState } from "react";
import { RingProgress } from "@/components/RingProgress";
import { RawatAkunProgressView, type CustomerDayProgressItem, type CustomerDayTaskItem } from "@/components/RawatAkunProgressView";
import { ExplorationProgressView } from "@/components/ExplorationProgressView";
import { CountProgressView } from "@/components/CountProgressView";
import {
  groupLinesByCategory,
  getPaketLines,
  getLineProgressTarget,
  getCategoryKind,
  type LineForGrouping,
} from "@/lib/order-progress-grouping";
import { STATUS_LABEL } from "@/types/game";
import { formatRupiah } from "@/lib/format";

interface UpdateEntry {
  id: string;
  note: string | null;
  screenshotUrl: string | null;
  resetLocation: string | null;
  createdAt: string; // ISO string
}

interface PaketBreakdownItem {
  id: string;
  title: string;
  categoryLabel: string;
}

interface PaketItemLine {
  id: string;
  title: string;
  actFrom: number | null;
  actTo: number | null;
  jokiItem: NonNullable<LineDetail["jokiItem"]>;
}

interface LineDetail extends LineForGrouping {
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
  }
  | null;
  explorationPercent: number | null;
  actFrom: number | null;
  actTo: number | null;
  materialQuantity: number | null;
  rawatAkunQuantity: number | null;
  characterName: string | null;
  levelFrom: number | null;
  levelTo: number | null;
  progressPercent: number | null;
  progressCurrent: number | null;
  calculatedPrice: number;
  updates: UpdateEntry[];
  rawatAkun: { days: CustomerDayProgressItem[]; tasks: CustomerDayTaskItem[] } | null;
  paketBreakdown: PaketBreakdownItem[];
  paketItems: PaketItemLine[];
}

export interface AccountProgress {
  orderId: string;
  orderCode: string;
  gameName: string;
  gameAccent: string;
  status: string;
  progressPct: number;
  jokerName: string | null;
  estimasiJoki: string | null;
  totalPrice: number;
  lines: LineDetail[];
}

function lineDetailTags(line: LineDetail): string[] {
  const tags: string[] = [];
  if (line.explorationPercent != null) tags.push(`${line.explorationPercent}% sudah dikerjakan sendiri`);
  if (line.actFrom != null && line.actTo != null) tags.push(`Act ${line.actFrom}-${line.actTo}`);
  if (line.materialQuantity != null) tags.push(`${line.materialQuantity} material`);
  if (line.rawatAkunQuantity != null) tags.push(`${line.rawatAkunQuantity}x rawat akun`);
  if (line.levelFrom != null && line.levelTo != null) tags.push(`Level ${line.levelFrom} → ${line.levelTo}`);
  return tags;
}

function UpdatesHistory({ updates }: { updates: UpdateEntry[] }) {
  if (updates.length === 0) {
    return <p className="text-shihu-faint text-[12.5px]">Belum ada update untuk item ini.</p>;
  }
  return (
    <div className="flex flex-col gap-2.5">
      {updates.map((u) => (
        <div key={u.id} className="border-l-2 border-shihu-corona/40 pl-3.5 py-0.5">
          <p className="text-[11px] text-shihu-faint font-display mb-1">
            {new Date(u.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
          </p>
          {u.note && <p className="text-[13px] text-shihu-text mb-1">{u.note}</p>}
          {u.resetLocation && (
            <p className="text-[12.5px] text-shihu-muted mb-1">
              <span className="text-shihu-corona font-medium">Dihabiskan di: </span>
              {u.resetLocation}
            </p>
          )}
          {u.screenshotUrl && (
            <a href={u.screenshotUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={u.screenshotUrl}
                alt="Bukti progres"
                className="max-w-[220px] rounded-lg border border-shihu-border"
              />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function LineDetailBody({ line }: { line: LineDetail }) {
  const kind = getCategoryKind(line);

  const header = (
    <div>
      <p className="font-display text-sm font-semibold mb-1.5">{line.title}</p>
      <div className="flex flex-wrap gap-1.5">
        {lineDetailTags(line).map((tag) => (
          <span key={tag} className="text-[10.5px] px-2 py-0.5 rounded-md bg-[#2C2540] text-shihu-muted font-display">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );

  if (kind === "RAWAT_AKUN" && line.rawatAkun) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <RawatAkunProgressView days={line.rawatAkun.days} tasks={line.rawatAkun.tasks} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {header}

      {kind === "EKSPLORASI" && <ExplorationProgressView title={line.title} percent={line.progressPercent ?? 0} />}

      {(kind === "QUEST" || kind === "MATERIAL") && (
        <CountProgressView
          title={line.title}
          current={line.progressCurrent ?? 0}
          target={getLineProgressTarget(line)}
          unitLabel={kind === "QUEST" ? "Act" : "item"}
        />
      )}

      <div>
        <p className="font-display text-xs font-semibold text-shihu-muted mb-2">Riwayat pengerjaan</p>
        <UpdatesHistory updates={line.updates} />
      </div>
    </div>
  );
}

function PaketDetailBody({ line }: { line: LineDetail }) {
  const byCategory = useMemo(() => {
    const map = new Map<string, PaketBreakdownItem[]>();
    for (const item of line.paketBreakdown) {
      if (!map.has(item.categoryLabel)) map.set(item.categoryLabel, []);
      map.get(item.categoryLabel)!.push(item);
    }
    return Array.from(map.entries());
  }, [line.paketBreakdown]);

  const itemLines: LineDetail[] = line.paketItems.map((item) => ({
    id: `${line.id}:${item.id}`,
    jokiPaketId: null,
    title: item.title,
    jokiItem: item.jokiItem,
    explorationPercent: null,
    actFrom: item.actFrom,
    actTo: item.actTo,
    materialQuantity: line.materialQuantity,
    rawatAkunQuantity: line.rawatAkunQuantity,
    characterName: null,
    levelFrom: null,
    levelTo: null,
    progressPercent: line.progressPercent,
    progressCurrent: line.progressCurrent,
    calculatedPrice: line.calculatedPrice,
    updates: line.updates,
    rawatAkun: line.rawatAkun,
    paketBreakdown: [],
    paketItems: [],
  }));

  return (
    <div className="flex flex-col gap-4">
      <p className="font-display text-sm font-semibold">{line.title}</p>

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

      {itemLines.length > 0 ? <CategorySection lines={itemLines} /> : (
        <div>
          <p className="font-display text-xs font-semibold text-shihu-muted mb-2">Riwayat pengerjaan</p>
          <UpdatesHistory updates={line.updates} />
        </div>
      )}
    </div>
  );
}

/** Tab level 1 (kategori) + level 2 (region/jenis quest) untuk baris non-paket. */
function CategorySection({ lines }: { lines: LineDetail[] }) {
  const groups = useMemo(() => groupLinesByCategory(lines), [lines]);
  const [activeGroupIdx, setActiveGroupIdx] = useState(0);
  const [activeSubIdx, setActiveSubIdx] = useState(0);
  const [activeLineIdx, setActiveLineIdx] = useState(0);

  if (groups.length === 0) return null;

  const activeGroup = groups[Math.min(activeGroupIdx, groups.length - 1)];
  const activeSub = activeGroup.subGroups[Math.min(activeSubIdx, activeGroup.subGroups.length - 1)];
  const activeLine = activeSub.lines[Math.min(activeLineIdx, activeSub.lines.length - 1)];

  function selectGroup(i: number) {
    setActiveGroupIdx(i);
    setActiveSubIdx(0);
    setActiveLineIdx(0);
  }

  function selectSub(i: number) {
    setActiveSubIdx(i);
    setActiveLineIdx(0);
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
              onClick={() => selectSub(i)}
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

      {activeSub.lines.length > 1 && (
        <div className="flex gap-1.5 flex-wrap pl-1">
          {activeSub.lines.map((line, i) => (
            <button
              key={line.id}
              onClick={() => setActiveLineIdx(i)}
              className="px-3 py-1.5 rounded-lg font-display text-[11px] font-medium transition-colors max-w-[180px] truncate"
              style={{
                backgroundColor: activeLineIdx === i ? "#1C1830" : "transparent",
                color: activeLineIdx === i ? "#FFB238" : "#867BA0",
                border: `1px solid ${activeLineIdx === i ? "#FFB23855" : "#362D4C"}`,
              }}
              title={line.title}
            >
              {line.title}
            </button>
          ))}
        </div>
      )}

      {activeLine && (
        <div className="bg-shihu-card border border-shihu-border rounded-2xl p-5">
          <LineDetailBody line={activeLine} />
        </div>
      )}
    </div>
  );
}

export function CustomerAccountTabs({ accounts }: { accounts: AccountProgress[] }) {
  const [activeTab, setActiveTab] = useState(0);
  const [activeTopIdx, setActiveTopIdx] = useState(0);

  if (accounts.length === 0) {
    return (
      <div className="bg-shihu-card border border-shihu-border rounded-2xl p-8 text-center">
        <p className="text-shihu-muted text-sm">Belum ada pesanan yang sedang berjalan.</p>
      </div>
    );
  }

  const account = accounts[activeTab];
  const lines = account?.lines ?? [];
  const paketLines = getPaketLines(lines);
  const categoryLines = lines.filter((l) => !l.jokiPaketId);

  const topTabs = [
    ...(categoryLines.length > 0 ? [{ key: "__categories__", label: null as string | null }] : []),
    ...paketLines.map((p) => ({ key: p.id, label: p.title as string | null })),
  ];
  const activeTopTab = topTabs[Math.min(activeTopIdx, topTabs.length - 1)];

  return (
    <div>
      {accounts.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-5">
          {accounts.map((acc, i) => (
            <button
              key={acc.orderId}
              onClick={() => {
                setActiveTab(i);
                setActiveTopIdx(0);
              }}
              className="px-4 py-2.5 rounded-xl font-display text-sm font-medium transition-colors"
              style={{
                backgroundColor: activeTab === i ? "#2C2540" : "transparent",
                color: activeTab === i ? "#FFB238" : "#B7ADD1",
                border: `1px solid ${activeTab === i ? "#FFB23855" : "#3D3557"}`,
              }}
            >
              Akun {i + 1} · {acc.gameName}
            </button>
          ))}
        </div>
      )}

      {account && (
        <div className="flex flex-col gap-5">
          <div className="bg-shihu-card border border-shihu-border rounded-2xl p-5 flex items-center gap-4 flex-wrap">
            <RingProgress value={account.progressPct} accent={account.gameAccent} size={64} />
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[11px] text-shihu-faint font-display">{account.orderCode}</span>
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full font-display"
                  style={{ backgroundColor: `${account.gameAccent}1F`, color: account.gameAccent }}
                >
                  {account.gameName}
                </span>
              </div>
              <p className="font-display text-base font-semibold mb-0.5">
                {STATUS_LABEL[account.status] ?? account.status}
              </p>
              <p className="text-shihu-muted text-[12.5px]">
                Joki: {account.jokerName ?? "belum ditugaskan"}
                {account.estimasiJoki && ` · Estimasi: ${account.estimasiJoki}`}
              </p>
            </div>
            <p className="font-display font-bold text-shihu-corona">{formatRupiah(account.totalPrice)}</p>
          </div>

          {topTabs.length > 1 && (
            <div className="flex gap-1.5 flex-wrap">
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
          )}

          {activeTopTab?.key === "__categories__" ? (
            <CategorySection lines={categoryLines} />
          ) : activeTopTab ? (
            <div className="bg-shihu-card border border-shihu-border rounded-2xl p-5">
              <PaketDetailBody line={paketLines.find((p) => p.id === activeTopTab.key)!} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}