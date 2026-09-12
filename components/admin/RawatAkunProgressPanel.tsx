"use client";

import { useMemo, useState, useActionState } from "react";
import {
  setDayPercent,
  saveDayUpdate,
  deleteDayScreenshot,
  updateDayTaskStatus,
  addDayTask,
  deleteDayTask,
  type DayUpdateActionState,
} from "@/lib/actions/rawat-akun-progress";

export interface DayProgressItem {
  date: string; // ISO yyyy-mm-dd (00:00 local)
  percent: number;
  note: string | null;
  screenshotUrls: string[];
}

export interface DayTaskItem {
  id: string;
  date: string; // ISO yyyy-mm-dd
  category: string;
  label: string;
  status: "BELUM" | "SEDANG" | "SELESAI";
  note: string | null;
}

interface RawatAkunProgressPanelProps {
  orderLineId: string;
  days: DayProgressItem[]; // sudah terurut tanggal, satu baris per hari dalam rentang
  tasks: DayTaskItem[];
}

function localDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const STATUS_STYLE: Record<string, string> = {
  SELESAI: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  SEDANG: "bg-shihu-corona/15 text-shihu-corona border-shihu-corona/30",
  BELUM: "bg-white/5 text-shihu-muted border-shihu-border",
};

const STATUS_LABEL: Record<string, string> = {
  SELESAI: "Selesai",
  SEDANG: "Sedang Dikerjakan",
  BELUM: "Belum Dimulai",
};

function dayName(iso: string) {
  return new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(new Date(`${iso}T00:00:00`));
}
function dayNum(iso: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(new Date(`${iso}T00:00:00`));
}
function statusOf(percent: number): "SELESAI" | "SEDANG" | "BELUM" {
  if (percent >= 100) return "SELESAI";
  if (percent > 0) return "SEDANG";
  return "BELUM";
}

export function RawatAkunProgressPanel({ orderLineId, days, tasks }: RawatAkunProgressPanelProps) {
  const todayIso = localDateKey();
  const defaultDay = days.find((d) => d.date === todayIso)?.date ?? days[days.length - 1]?.date ?? days[0]?.date;
  const [selectedDate, setSelectedDate] = useState<string>(defaultDay ?? "");
  const [manualPercent, setManualPercent] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("");
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);

  const [saveState, saveAction] = useActionState<DayUpdateActionState, FormData>(saveDayUpdate, {});

  const selectedDay = days.find((d) => d.date === selectedDate) ?? days[0];
  const selectedTasks = tasks.filter((t) => t.date === selectedDate);

  const breakdown = useMemo(() => {
    let selesai = 0;
    let sedang = 0;
    let belum = 0;
    let sum = 0;
    for (const d of days) {
      const s = statusOf(d.percent);
      if (s === "SELESAI") selesai++;
      else if (s === "SEDANG") sedang++;
      else belum++;
      sum += d.percent;
    }
    const total = days.length || 1;
    return {
      total: days.length,
      selesai,
      sedang,
      belum,
      totalPercent: Math.round(sum / total),
    };
  }, [days]);

  return (
    <div className="flex flex-col gap-5">
      {/* Kalender harian */}
      <div>
        <p className="text-xs font-display font-semibold text-shihu-text mb-2">Progress Harian</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {days.map((d) => {
            const status = statusOf(d.percent);
            const active = d.date === selectedDate;
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => setSelectedDate(d.date)}
                className={`shrink-0 w-[84px] rounded-xl border px-2 py-2.5 text-center transition-colors ${active
                    ? "border-shihu-corona bg-shihu-corona/10"
                    : "border-shihu-border bg-[#241E38] hover:border-shihu-corona/40"
                  }`}
              >
                <p className="text-[10px] text-shihu-faint">{dayName(d.date)}</p>
                <p className="text-[11px] text-shihu-text font-medium mb-1">{dayNum(d.date)}</p>
                <div
                  className={`mx-auto w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-semibold ${STATUS_STYLE[status]}`}
                >
                  {status === "SELESAI" ? "✓" : `${d.percent}%`}
                </div>
                <p className="text-[9.5px] text-shihu-faint mt-1 leading-tight">{STATUS_LABEL[status]}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Kolom kiri: detail hari terpilih */}
        <div className="flex flex-col gap-4">
          {selectedDay && (
            <div className="bg-[#241E38] border border-shihu-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-display font-semibold text-shihu-text">
                  {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(
                    new Date(`${selectedDay.date}T00:00:00`)
                  )}
                </p>
                <p className="text-xs text-shihu-muted">
                  Progress Hari Ini:{" "}
                  <span className="text-shihu-corona font-semibold">{selectedDay.percent}%</span>
                </p>
              </div>

              <form action={saveAction} className="flex flex-col gap-3">
                <input type="hidden" name="orderLineId" value={orderLineId} />
                <input type="hidden" name="date" value={selectedDay.date} />

                <div>
                  <label className="block text-[11px] text-shihu-muted mb-1">Catatan Hari Ini (opsional)</label>
                  <textarea
                    name="note"
                    defaultValue={selectedDay.note ?? ""}
                    rows={3}
                    className="admin-input resize-none"
                    placeholder="Tulis progres pengerjaan hari ini..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-shihu-muted mb-1">Screenshot (opsional, link URL)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedDay.screenshotUrls.map((url) => (
                      <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden border border-shihu-border group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="Screenshot" className="w-full h-full object-cover" />
                        <button
                          type="submit"
                          formAction={deleteDayScreenshot}
                          name="url"
                          value={url}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 text-white text-[10px] flex items-center justify-center transition-opacity"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                  <input
                    type="url"
                    name="screenshotUrl"
                    value={screenshotUrl}
                    onChange={(e) => setScreenshotUrl(e.target.value)}
                    placeholder="https://..."
                    className="admin-input"
                  />
                </div>

                {saveState?.error && <p className="text-xs text-red-400">{saveState.error}</p>}

                <button
                  type="submit"
                  className="self-end px-4 py-2 rounded-lg bg-corona text-[#1A1206] text-xs font-display font-semibold"
                >
                  Simpan Update
                </button>
              </form>
            </div>
          )}

          {/* Task checklist */}
          <div className="bg-[#241E38] border border-shihu-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-display font-semibold text-shihu-text">Task Checklist (Hari Ini)</p>
              <button
                type="button"
                onClick={() => setShowAddTask((v) => !v)}
                className="text-[11px] px-2.5 py-1 rounded-lg border border-shihu-border text-shihu-muted hover:border-shihu-corona/40"
              >
                {showAddTask ? "Batal" : "+ Kelola Checklist"}
              </button>
            </div>

            {showAddTask && (
              <form
                action={addDayTask}
                className="flex flex-wrap gap-2 mb-3 bg-white/5 rounded-xl p-2.5"
                onSubmit={() => {
                  setNewTaskCategory("");
                  setNewTaskLabel("");
                }}
              >
                <input type="hidden" name="orderLineId" value={orderLineId} />
                <input type="hidden" name="date" value={selectedDate} />
                <input
                  name="category"
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value)}
                  placeholder="Kategori (mis. Event)"
                  className="admin-input flex-1 min-w-[120px]"
                  required
                />
                <input
                  name="label"
                  value={newTaskLabel}
                  onChange={(e) => setNewTaskLabel(e.target.value)}
                  placeholder="Task / Aktivitas"
                  className="admin-input flex-[2] min-w-[160px]"
                  required
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-corona text-[#1A1206] text-xs font-display font-semibold"
                >
                  Tambah
                </button>
              </form>
            )}

            {selectedTasks.length === 0 ? (
              <p className="text-xs text-shihu-faint py-3 text-center">
                Tidak ada task untuk tanggal ini.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-shihu-border">
                {selectedTasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 py-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-shihu-muted border border-shihu-border shrink-0">
                      {t.category}
                    </span>
                    <span className="text-xs text-shihu-text flex-1">{t.label}</span>
                    <form
                      action={updateDayTaskStatus}
                      onChange={(e) => (e.currentTarget as HTMLFormElement).requestSubmit()}
                    >
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="orderLineId" value={orderLineId} />
                      <select
                        name="status"
                        defaultValue={t.status}
                        className="admin-input !py-1 !text-[11px] !w-auto"
                      >
                        <option value="BELUM">Belum</option>
                        <option value="SEDANG">Sedang Dikerjakan</option>
                        <option value="SELESAI">Selesai</option>
                      </select>
                    </form>
                    <form action={deleteDayTask}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="orderLineId" value={orderLineId} />
                      <button type="submit" className="text-red-400/70 hover:text-red-400 text-xs px-1">
                        ✕
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Kolom kanan: ring progress + quick update */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#241E38] border border-shihu-border rounded-2xl p-4">
            <p className="text-xs font-display font-semibold text-shihu-text mb-3">Progress Keseluruhan</p>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-sm font-bold text-shihu-text shrink-0"
                style={{
                  background: `conic-gradient(#FFB238 ${breakdown.totalPercent * 3.6}deg, #3D3557 0deg)`,
                }}
              >
                <div className="w-11 h-11 rounded-full bg-[#241E38] flex items-center justify-center text-xs">
                  {breakdown.totalPercent}%
                </div>
              </div>
              <div className="flex flex-col gap-1 text-[10.5px]">
                <p className="text-emerald-300">
                  ● Selesai ({breakdown.selesai} hari)
                </p>
                <p className="text-shihu-corona">
                  ● Sedang Dikerjakan ({breakdown.sedang} hari)
                </p>
                <p className="text-shihu-faint">
                  ● Belum Dimulai ({breakdown.belum} hari)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#241E38] border border-shihu-border rounded-2xl p-4">
            <p className="text-xs font-display font-semibold text-shihu-text mb-3">Quick Update</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { label: "Selesai Hari Ini", percent: 100 },
                { label: "Update 50%", percent: 50 },
                { label: "Update 75%", percent: 75 },
                { label: "Reset ke 0%", percent: 0 },
              ].map((btn) => (
                <form action={setDayPercent} key={btn.label}>
                  <input type="hidden" name="orderLineId" value={orderLineId} />
                  <input type="hidden" name="date" value={selectedDate} />
                  <input type="hidden" name="percent" value={btn.percent} />
                  <button
                    type="submit"
                    className="w-full px-2 py-2 rounded-lg border border-shihu-border text-[11px] text-shihu-text hover:border-shihu-corona/40"
                  >
                    {btn.label}
                  </button>
                </form>
              ))}
            </div>
            <form action={setDayPercent} className="flex gap-2">
              <input type="hidden" name="orderLineId" value={orderLineId} />
              <input type="hidden" name="date" value={selectedDate} />
              <input
                type="number"
                name="percent"
                min={0}
                max={100}
                value={manualPercent}
                onChange={(e) => setManualPercent(e.target.value)}
                placeholder="mis. 70"
                className="admin-input flex-1"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-lg bg-corona text-[#1A1206] text-xs font-display font-semibold shrink-0"
              >
                Terapkan
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
