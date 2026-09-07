"use client";

import { useMemo, useState } from "react";
import { calculateJokiItemLinePrice, type JokiItemForPricing } from "@/lib/order-pricing";
import { formatRupiah, formatDate } from "@/lib/format";

export interface JokiItemOption extends JokiItemForPricing {
  id: string;
  gameId: string;
  title: string;
  actNumber: number | null;
  /// Khusus kategori Rawat Akun: dipakai menghitung & mempratinjau tanggal
  /// selesai baris order (lihat lib/rawat-akun-schedule.ts).
  isPatchWide: boolean;
  durationDays: number | null;
  patch: { startDate: string; endDate: string } | null; // ISO string
}

export interface JokiPaketOption {
  id: string;
  gameId: string;
  title: string;
  priceRupiah: number;
}

interface LineState {
  type: "item" | "paket";
  id: string;
  explorationPercent: string;
  actFrom: string;
  actTo: string;
  materialQuantity: string;
  rawatAkunQuantity: string;
  rawatAkunStartDate: string; // yyyy-mm-dd
}

export interface ExportedLine {
  type: "item" | "paket";
  id: string;
  explorationPercent: number | null;
  actFrom: number | null;
  actTo: number | null;
  materialQuantity: number | null;
  rawatAkunQuantity: number | null;
  rawatAkunStartDate: string | null;
}

function todayInputValue(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Pratinjau tanggal selesai rawat akun non patch-wide, dihitung di client hanya untuk ditampilkan (perhitungan final tetap di server saat order dibuat). */
function previewEndDate(startDateStr: string, durationDays: number | null, quantity: number): string | null {
  if (!durationDays || durationDays <= 0 || !startDateStr) return null;
  const start = new Date(`${startDateStr}T00:00:00`);
  if (Number.isNaN(start.getTime())) return null;
  const totalDays = durationDays * Math.max(1, quantity || 1);
  const end = new Date(start);
  end.setDate(end.getDate() + (totalDays - 1));
  return formatDate(end);
}

interface OrderLineSelectorProps {
  gameId: string;
  items: JokiItemOption[];
  pakets: JokiPaketOption[];
  onLinesChange?: (lines: ExportedLine[], total: number) => void;
}

export function OrderLineSelector({ gameId, items, pakets, onLinesChange }: OrderLineSelectorProps) {
  const [selectedLines, setSelectedLines] = useState<Map<string, LineState>>(new Map());

  const itemsForGame = useMemo(() => items.filter((i) => i.gameId === gameId), [items, gameId]);
  const paketsForGame = useMemo(() => pakets.filter((p) => p.gameId === gameId), [pakets, gameId]);

  function makeKey(type: "item" | "paket", id: string) {
    return `${type}:${id}`;
  }

  function emitChange(lines: Map<string, LineState>) {
    if (!onLinesChange) return;
    const exported: ExportedLine[] = Array.from(lines.values()).map((l) => ({
      type: l.type,
      id: l.id,
      explorationPercent: l.explorationPercent ? Number(l.explorationPercent) : null,
      actFrom: l.actFrom ? Number(l.actFrom) : null,
      actTo: l.actTo ? Number(l.actTo) : null,
      materialQuantity: l.materialQuantity ? Number(l.materialQuantity) : null,
      rawatAkunQuantity: l.rawatAkunQuantity ? Number(l.rawatAkunQuantity) : null,
      rawatAkunStartDate: l.rawatAkunStartDate || null,
    }));
    onLinesChange(exported, computeTotal(lines));
  }

  function toggleLine(type: "item" | "paket", id: string, item?: JokiItemOption) {
    setSelectedLines((prev) => {
      const key = makeKey(type, id);
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, {
          type,
          id,
          explorationPercent: "0",
          actFrom: "1",
          actTo: String(item?.actNumber ?? 1),
          materialQuantity: "",
          rawatAkunQuantity: "1",
          rawatAkunStartDate: todayInputValue(),
        });
      }
      emitChange(next);
      return next;
    });
  }

  function updateLineField(key: string, field: keyof Omit<LineState, "type" | "id">, value: string) {
    setSelectedLines((prev) => {
      const existing = prev.get(key);
      if (!existing) return prev;
      const next = new Map(prev);
      next.set(key, { ...existing, [field]: value });
      emitChange(next);
      return next;
    });
  }

  function computeTotal(lines: Map<string, LineState>): number {
    let sum = 0;
    for (const line of lines.values()) {
      if (line.type === "paket") {
        const paket = paketsForGame.find((p) => p.id === line.id);
        if (paket) sum += paket.priceRupiah;
        continue;
      }
      const item = itemsForGame.find((i) => i.id === line.id);
      if (!item) continue;
      const result = calculateJokiItemLinePrice(item, {
        explorationPercent: line.explorationPercent ? Number(line.explorationPercent) : null,
        actFrom: line.actFrom ? Number(line.actFrom) : null,
        actTo: line.actTo ? Number(line.actTo) : null,
        materialQuantity: line.materialQuantity ? Number(line.materialQuantity) : null,
        rawatAkunQuantity: line.rawatAkunQuantity ? Number(line.rawatAkunQuantity) : null,
      });
      if (result.valid) sum += result.price;
    }
    return sum;
  }

  return (
    <div className="flex flex-col gap-3">

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1.5">
          Joki Item
        </label>
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto bg-[#241E38] rounded-xl border border-shihu-border p-2.5">
          {itemsForGame.length === 0 && (
            <p className="text-[11px] text-shihu-faint px-1 py-1">Belum ada Joki Item untuk game ini.</p>
          )}
          {itemsForGame.map((item) => {
            const key = makeKey("item", item.id);
            const line = selectedLines.get(key);
            const checked = !!line;
            const priceResult = line
              ? calculateJokiItemLinePrice(item, {
                  explorationPercent: line.explorationPercent ? Number(line.explorationPercent) : null,
                  actFrom: line.actFrom ? Number(line.actFrom) : null,
                  actTo: line.actTo ? Number(line.actTo) : null,
                  materialQuantity: line.materialQuantity ? Number(line.materialQuantity) : null,
                  rawatAkunQuantity: line.rawatAkunQuantity ? Number(line.rawatAkunQuantity) : null,
                })
              : null;

            return (
              <div key={item.id} className="border border-shihu-border rounded-lg p-2.5 bg-shihu-card">
                <label className="flex items-center gap-2 text-xs text-shihu-text">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleLine("item", item.id, item)}
                    className="accent-shihu-corona w-3.5 h-3.5 shrink-0"
                  />
                  <span className="flex-1">{item.title}</span>
                  {checked && priceResult && (
                    <span className="text-shihu-corona font-display font-semibold text-[11px]">
                      {priceResult.valid ? formatRupiah(priceResult.price) : "—"}
                    </span>
                  )}
                </label>

                {checked && (
                  <div className="mt-2 pl-5">
                    {item.category.isMaterial && (
                      <div>
                        <label className="block text-[10.5px] text-shihu-muted mb-1">
                          Jumlah material yang dicari
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={line!.materialQuantity}
                          onChange={(e) => updateLineField(key, "materialQuantity", e.target.value)}
                          className="admin-input"
                          placeholder="mis. 300"
                        />
                      </div>
                    )}
                    {item.category.requiresQuestType && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10.5px] text-shihu-muted mb-1">Act mulai</label>
                          <input
                            type="number"
                            min={1}
                            value={line!.actFrom}
                            onChange={(e) => updateLineField(key, "actFrom", e.target.value)}
                            className="admin-input"
                          />
                        </div>
                        <div>
                          <label className="block text-[10.5px] text-shihu-muted mb-1">Act selesai</label>
                          <input
                            type="number"
                            min={1}
                            value={line!.actTo}
                            onChange={(e) => updateLineField(key, "actTo", e.target.value)}
                            className="admin-input"
                          />
                        </div>
                      </div>
                    )}
                    {!item.category.isMaterial && !item.category.requiresQuestType && item.category.requiresRegion && (
                      <div>
                        <label className="block text-[10.5px] text-shihu-muted mb-1">
                          Persentase map yang sudah dikerjakan sendiri (0-100)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={line!.explorationPercent}
                          onChange={(e) => updateLineField(key, "explorationPercent", e.target.value)}
                          className="admin-input"
                        />
                      </div>
                    )}
                    {!item.category.isMaterial &&
                      !item.category.requiresQuestType &&
                      !item.category.requiresRegion &&
                      item.category.isRawatAkun && (
                        <div className="flex flex-col gap-2">
                          <div>
                            <label className="block text-[10.5px] text-shihu-muted mb-1">
                              Jumlah (mis. jumlah minggu/siklus)
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={line!.rawatAkunQuantity}
                              onChange={(e) => updateLineField(key, "rawatAkunQuantity", e.target.value)}
                              className="admin-input"
                            />
                          </div>
                          {item.isPatchWide ? (
                            item.patch && (
                              <p className="text-[10.5px] text-shihu-faint">
                                Rentang mengikuti Patch: {formatDate(item.patch.startDate)} – {formatDate(item.patch.endDate)}
                              </p>
                            )
                          ) : (
                            <div>
                              <label className="block text-[10.5px] text-shihu-muted mb-1">
                                Tanggal mulai rawat akun
                              </label>
                              <input
                                type="date"
                                value={line!.rawatAkunStartDate}
                                onChange={(e) => updateLineField(key, "rawatAkunStartDate", e.target.value)}
                                className="admin-input"
                              />
                              {item.durationDays ? (
                                <p className="text-[10.5px] text-shihu-faint mt-1">
                                  Estimasi selesai:{" "}
                                  {previewEndDate(
                                    line!.rawatAkunStartDate,
                                    item.durationDays,
                                    Number(line!.rawatAkunQuantity)
                                  ) ?? "—"}
                                </p>
                              ) : (
                                <p className="text-[10.5px] text-red-400 mt-1">
                                  Joki Item ini belum punya durasi (hari) -- edit dulu di halaman Joki Item.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    {priceResult && !priceResult.valid && (
                      <p className="text-[10.5px] text-red-400 mt-1">{priceResult.error}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1.5">
          Paket Joki
        </label>
        <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto bg-[#241E38] rounded-xl border border-shihu-border p-2.5">
          {paketsForGame.length === 0 && (
            <p className="text-[11px] text-shihu-faint px-1 py-1">Belum ada Paket Joki untuk game ini.</p>
          )}
          {paketsForGame.map((paket) => {
            const key = makeKey("paket", paket.id);
            const checked = selectedLines.has(key);
            return (
              <label key={paket.id} className="flex items-center gap-2 text-xs text-shihu-text px-1 py-1">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleLine("paket", paket.id)}
                  className="accent-shihu-corona w-3.5 h-3.5 shrink-0"
                />
                <span className="flex-1">{paket.title}</span>
                {checked && (
                  <span className="text-shihu-corona font-display font-semibold text-[11px]">
                    {formatRupiah(paket.priceRupiah)}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
