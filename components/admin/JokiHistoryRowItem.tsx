"use client";

import { useState } from "react";
import { deleteJokiHistoryEntry } from "@/lib/actions/joki-history";
import { Stars } from "@/components/Stars";
import { formatDate } from "@/lib/format";

interface JokiHistoryRow {
  id: string;
  title: string;
  customerName: string;
  jokerName: string | null;
  completedAt: Date;
  rating: number | null;
  note: string | null;
  screenshotUrls: string[];
  shareToken: string;
  hasTestimonial: boolean;
  game: { name: string; accentColor: string };
}

export function JokiHistoryRowItem({ item }: { item: JokiHistoryRow }) {
  const [showDetail, setShowDetail] = useState(false);
  const [copied, setCopied] = useState(false);

  function copyTestimonialLink() {
    const url = `${window.location.origin}/testimoni-lama/${item.shareToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="bg-shihu-card border border-shihu-border rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: item.game.accentColor }}
        />
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display text-sm font-semibold">{item.title}</p>
            {item.rating != null && <Stars rating={item.rating} />}
          </div>
          <p className="text-shihu-muted text-xs mt-0.5">
            {item.game.name} · {item.customerName} · Selesai{" "}
            {formatDate(item.completedAt)}
            {item.jokerName && ` · Joki: ${item.jokerName}`}
          </p>
        </div>
        <button
          onClick={copyTestimonialLink}
          className="px-3 py-1.5 rounded-lg text-xs font-display font-medium border border-shihu-borderSoft text-shihu-corona hover:bg-[#2C2540]"
        >
          {copied
            ? "Link disalin!"
            : item.hasTestimonial
              ? "Salin link (sudah diisi)"
              : "Salin link testimoni"}
        </button>
        <button
          onClick={() => setShowDetail((v) => !v)}
          className="px-3 py-1.5 rounded-lg text-xs font-display font-medium border border-shihu-borderSoft text-shihu-text hover:bg-[#2C2540]"
        >
          {showDetail ? "Tutup" : "Lihat Detail"}
        </button>
        <form action={deleteJokiHistoryEntry}>
          <input type="hidden" name="id" value={item.id} />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg text-xs font-display font-medium text-red-400 hover:bg-red-400/10"
          >
            Hapus
          </button>
        </form>
      </div>

      {showDetail && (
        <div className="bg-[#241E38] border border-shihu-border rounded-xl p-3.5 flex flex-col gap-3">
          {item.note ? (
            <div>
              <p className="text-[11px] text-shihu-muted mb-1">Catatan</p>
              <p className="text-xs text-shihu-text whitespace-pre-line">
                {item.note}
              </p>
            </div>
          ) : (
            <p className="text-xs text-shihu-faint">
              Tidak ada catatan tambahan.
            </p>
          )}

          {item.screenshotUrls.length > 0 ? (
            <div>
              <p className="text-[11px] text-shihu-muted mb-1">
                Screenshot ({item.screenshotUrls.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {item.screenshotUrls.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt="Screenshot bukti joki"
                      className="w-20 h-20 rounded-lg object-cover border border-shihu-border hover:border-shihu-corona/50 transition-colors"
                    />
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-shihu-faint">
              Belum ada screenshot bukti pengerjaan.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
