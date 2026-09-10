"use client";

import {
  RawatAkunProgressView,
  type CustomerDayProgressItem,
  type CustomerDayTaskItem,
} from "@/components/RawatAkunProgressView";

export interface OrderLineUpdateEntry {
  id: string;
  note: string | null;
  screenshotUrl: string | null;
  resetLocation: string | null;
  createdAt: string; // ISO string
}

export interface OrderLineDetail {
  id: string;
  title: string;
  explorationPercent: number | null;
  actFrom: number | null;
  actTo: number | null;
  materialQuantity: number | null;
  rawatAkunQuantity: number | null;
  characterName: string | null;
  levelFrom: number | null;
  levelTo: number | null;
  updates: OrderLineUpdateEntry[];
  rawatAkun: { days: CustomerDayProgressItem[]; tasks: CustomerDayTaskItem[] } | null;
}

function lineDetailTags(line: OrderLineDetail): string[] {
  const tags: string[] = [];
  if (line.explorationPercent != null)
    tags.push(`${line.explorationPercent}% sudah dikerjakan sendiri`);
  if (line.actFrom != null && line.actTo != null) tags.push(`Act ${line.actFrom}-${line.actTo}`);
  if (line.materialQuantity != null) tags.push(`${line.materialQuantity} material`);
  if (line.rawatAkunQuantity != null) tags.push(`${line.rawatAkunQuantity}x rawat akun`);
  if (line.levelFrom != null && line.levelTo != null) tags.push(`Level ${line.levelFrom} → ${line.levelTo}`);
  return tags;
}

/**
 * Panel detail riwayat pengerjaan untuk satu item pesanan (joki item /
 * paket). Dipakai baik di halaman progress (akun yang masih berjalan)
 * maupun di halaman history (pesanan yang sudah selesai), supaya tampilan
 * detailnya konsisten di kedua tempat.
 *
 * `bare` — jika true, panel dirender tanpa card/background sendiri (dipakai
 * saat parent sudah menyediakan card pembungkus, mis. di CustomerAccountTabs).
 */
export function OrderLineDetailPanel({
  line,
  bare = false,
}: {
  line: OrderLineDetail;
  bare?: boolean;
}) {
  const tags = lineDetailTags(line);

  const body = (
    <>
      <p className="font-display text-[13px] font-semibold mb-1.5">{line.title}</p>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.map((tag) => (
            <span
              key={tag}
              className={`text-[10.5px] px-2 py-0.5 rounded-md text-shihu-muted font-display ${bare ? "bg-[#2C2540]" : "bg-shihu-card"
                }`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <p className="font-display text-xs font-semibold text-shihu-muted mb-2">
        Riwayat pengerjaan
      </p>

      {line.rawatAkun ? (
        <RawatAkunProgressView days={line.rawatAkun.days} tasks={line.rawatAkun.tasks} />
      ) : line.updates.length === 0 ? (
        <p className="text-shihu-faint text-[12.5px]">Belum ada update untuk item ini.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {line.updates.map((u) => (
            <div key={u.id} className="border-l-2 border-shihu-corona/40 pl-3.5 py-0.5">
              <p className="text-[11px] text-shihu-faint font-display mb-1">
                {new Date(u.createdAt).toLocaleString("id-ID", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
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
    </>
  );

  if (bare) return body;

  return <div className="bg-[#241E38] border border-shihu-border rounded-xl p-3.5">{body}</div>;
}
