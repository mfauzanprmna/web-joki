"use client";

import { useMemo, useState } from "react";

export interface CustomerDayProgressItem {
  date: string; // ISO yyyy-mm-dd
  percent: number;
  note: string | null;
  screenshotUrls: string[];
}

export interface CustomerDayTaskItem {
  date: string;
  category: string;
  label: string;
  status: "BELUM" | "SEDANG" | "SELESAI";
}

interface RawatAkunProgressViewProps {
  days: CustomerDayProgressItem[];
  tasks: CustomerDayTaskItem[];
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

export function RawatAkunProgressView({ days, tasks }: RawatAkunProgressViewProps) {
  const todayIso = localDateKey();
  const defaultDay = days.find((d) => d.date === todayIso)?.date ?? days[days.length - 1]?.date ?? days[0]?.date;
  const [selectedDate, setSelectedDate] = useState<string>(defaultDay ?? "");

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
    return { selesai, sedang, belum, totalPercent: Math.round(sum / total) };
  }, [days]);

  if (days.length === 0) {
    return (
      <p className="text-sm text-shihu-muted py-6 text-center">
        Kalender progres belum tersedia untuk pesanan ini.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-display font-semibold text-shihu-text mb-2">
          Kalender Aktivitas Harian
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {days.map((d) => {
            const status = statusOf(d.percent);
            const active = d.date === selectedDate;
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => setSelectedDate(d.date)}
                className={`shrink-0 w-[84px] rounded-xl border px-2 py-2.5 text-center transition-colors ${
                  active
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
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
                  Progress Hari Ini: <span className="text-shihu-corona font-semibold">{selectedDay.percent}%</span>
                </p>
              </div>

              {selectedDay.note && (
                <div className="mb-3">
                  <p className="text-[11px] text-shihu-muted mb-1">Catatan Pengerjaan</p>
                  <p className="text-xs text-shihu-text bg-white/5 rounded-lg p-2.5">{selectedDay.note}</p>
                </div>
              )}

              {selectedDay.screenshotUrls.length > 0 && (
                <div>
                  <p className="text-[11px] text-shihu-muted mb-1">Screenshot</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDay.screenshotUrls.map((url) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={url}
                        src={url}
                        alt="Screenshot progres"
                        className="w-16 h-16 rounded-lg object-cover border border-shihu-border"
                      />
                    ))}
                  </div>
                </div>
              )}

              {!selectedDay.note && selectedDay.screenshotUrls.length === 0 && (
                <p className="text-xs text-shihu-faint">Belum ada update untuk tanggal ini.</p>
              )}
            </div>
          )}

          <div className="bg-[#241E38] border border-shihu-border rounded-2xl p-4">
            <p className="text-xs font-display font-semibold text-shihu-text mb-3">Task Checklist</p>
            {selectedTasks.length === 0 ? (
              <p className="text-xs text-shihu-faint py-2 text-center">Tidak ada task untuk tanggal ini.</p>
            ) : (
              <div className="flex flex-col divide-y divide-shihu-border">
                {selectedTasks.map((t, i) => (
                  <div key={`${t.category}-${t.label}-${i}`} className="flex items-center gap-2 py-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-shihu-muted border border-shihu-border shrink-0">
                      {t.category}
                    </span>
                    <span className="text-xs text-shihu-text flex-1">{t.label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_STYLE[t.status]}`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#241E38] border border-shihu-border rounded-2xl p-4 h-fit">
          <p className="text-xs font-display font-semibold text-shihu-text mb-3">Progres Keseluruhan</p>
          <div className="flex items-center gap-3">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-sm font-bold text-shihu-text shrink-0"
              style={{ background: `conic-gradient(#FFB238 ${breakdown.totalPercent * 3.6}deg, #3D3557 0deg)` }}
            >
              <div className="w-11 h-11 rounded-full bg-[#241E38] flex items-center justify-center text-xs">
                {breakdown.totalPercent}%
              </div>
            </div>
            <div className="flex flex-col gap-1 text-[10.5px]">
              <p className="text-emerald-300">● Selesai ({breakdown.selesai} hari)</p>
              <p className="text-shihu-corona">● Sedang Dikerjakan ({breakdown.sedang} hari)</p>
              <p className="text-shihu-faint">● Belum Dimulai ({breakdown.belum} hari)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
