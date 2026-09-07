"use client";

import { useState } from "react";
import { RingProgress } from "@/components/RingProgress";
import { RawatAkunProgressView, type CustomerDayProgressItem, type CustomerDayTaskItem } from "@/components/RawatAkunProgressView";
import { STATUS_LABEL } from "@/types/game";
import { formatRupiah } from "@/lib/format";

interface UpdateEntry {
  id: string;
  note: string | null;
  screenshotUrl: string | null;
  resetLocation: string | null;
  createdAt: string; // ISO string
}

interface LineDetail {
  id: string;
  title: string;
  explorationPercent: number | null;
  actFrom: number | null;
  actTo: number | null;
  materialQuantity: number | null;
  rawatAkunQuantity: number | null;
  calculatedPrice: number;
  updates: UpdateEntry[];
  rawatAkun: { days: CustomerDayProgressItem[]; tasks: CustomerDayTaskItem[] } | null;
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
  return tags;
}

export function CustomerAccountTabs({ accounts }: { accounts: AccountProgress[] }) {
  const [activeTab, setActiveTab] = useState(0);
  const [activeLineIndex, setActiveLineIndex] = useState(0);

  if (accounts.length === 0) {
    return (
      <div className="bg-shihu-card border border-shihu-border rounded-2xl p-8 text-center">
        <p className="text-shihu-muted text-sm">Belum ada pesanan yang sedang berjalan.</p>
      </div>
    );
  }

  const account = accounts[activeTab];
  const lines = account?.lines ?? [];
  const activeLine = lines[activeLineIndex] ?? lines[0];

  return (
    <div>
      {accounts.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-5">
          {accounts.map((acc, i) => (
            <button
              key={acc.orderId}
              onClick={() => {
                setActiveTab(i);
                setActiveLineIndex(0);
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

          {lines.length > 1 && (
            <div className="flex gap-1.5 flex-wrap">
              {lines.map((line, i) => (
                <button
                  key={line.id}
                  onClick={() => setActiveLineIndex(i)}
                  className="px-3.5 py-2 rounded-xl font-display text-xs font-medium transition-colors max-w-[220px] truncate"
                  style={{
                    backgroundColor: activeLineIndex === i ? "#2C2540" : "transparent",
                    color: activeLineIndex === i ? "#FFB238" : "#B7ADD1",
                    border: `1px solid ${activeLineIndex === i ? "#FFB23855" : "#3D3557"}`,
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
              <p className="font-display text-sm font-semibold mb-1.5">{activeLine.title}</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {lineDetailTags(activeLine).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10.5px] px-2 py-0.5 rounded-md bg-[#2C2540] text-shihu-muted font-display"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="font-display text-xs font-semibold text-shihu-muted mb-2">
                Riwayat pengerjaan
              </p>
              {activeLine.rawatAkun ? (
                <RawatAkunProgressView days={activeLine.rawatAkun.days} tasks={activeLine.rawatAkun.tasks} />
              ) : activeLine.updates.length === 0 ? (
                <p className="text-shihu-faint text-[12.5px]">Belum ada update untuk item ini.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {activeLine.updates.map((u) => (
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
                        <a
                          href={u.screenshotUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-1"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element --
                              URL gambar berasal dari domain eksternal arbitrary
                              (imgur/postimages/dll, ditempel bebas oleh admin),
                              sehingga tidak bisa/praktis di-whitelist semua di
                              next.config.ts untuk next/image. */}
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
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
