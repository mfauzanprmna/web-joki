"use client";

import { useActionState, useEffect, useRef } from "react";
import { addOrderLineUpdate, deleteOrderLineUpdate, type OrderLineUpdateActionState } from "@/lib/actions/order-progress";
import { hasDailyResetContent, type OrderLineForProgressRules } from "@/lib/order-progress-rules";

interface UpdateEntry {
  id: string;
  note: string | null;
  screenshotUrl: string | null;
  resetLocation: string | null;
  createdAt: Date;
}

interface OrderLineProgressPanelProps {
  orderLineId: string;
  jokiItem: OrderLineForProgressRules["jokiItem"];
  updates: UpdateEntry[];
}

export function OrderLineProgressPanel({ orderLineId, jokiItem, updates }: OrderLineProgressPanelProps) {
  const isDailyReset = hasDailyResetContent({ jokiItem });
  const [state, formAction, pending] = useActionState<OrderLineUpdateActionState | undefined, FormData>(
    addOrderLineUpdate,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    if (hasSubmittedRef.current && !pending && !state?.error) {
      formRef.current?.reset();
      hasSubmittedRef.current = false;
    }
  }, [pending, state]);

  return (
    <div className="flex flex-col gap-4">
      <form
        ref={formRef}
        action={(formData) => {
          hasSubmittedRef.current = true;
          formAction(formData);
        }}
        className="bg-[#241E38] border border-shihu-border rounded-xl p-4 flex flex-col gap-3"
      >
        <input type="hidden" name="orderLineId" value={orderLineId} />
        <p className="font-display text-xs font-semibold text-shihu-muted">Tambah update progres</p>

        <div>
          <label className="block text-[11px] font-display font-medium text-shihu-muted mb-1">
            Catatan (opsional)
          </label>
          <textarea
            name="note"
            rows={2}
            className="admin-input"
            placeholder="mis. Sudah selesai chapter 3, lanjut chapter 4 besok"
          />
        </div>

        {isDailyReset ? (
          <div>
            <label className="block text-[11px] font-display font-medium text-shihu-muted mb-1">
              Dihabiskan di mana hari ini (opsional)
            </label>
            <input
              name="resetLocation"
              className="admin-input"
              placeholder="mis. Domain Cecilia Garden + weekly boss Andrius"
            />
          </div>
        ) : (
          <div>
            <label className="block text-[11px] font-display font-medium text-shihu-muted mb-1">
              Link screenshot bukti (opsional)
            </label>
            <input
              name="screenshotUrl"
              className="admin-input"
              placeholder="https://i.imgur.com/..."
            />
            <p className="text-[10.5px] text-shihu-faint mt-1">
              Upload gambar ke imgur/postimages dulu, lalu tempel link-nya di sini.
            </p>
          </div>
        )}

        {state?.error && (
          <p className="text-[12px] text-red-400 bg-red-400/10 rounded-lg px-2.5 py-1.5">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="self-start px-4 py-2 rounded-lg font-display font-semibold text-xs text-[#1A1206] bg-corona disabled:opacity-60"
        >
          {pending ? "Menyimpan..." : "Tambah update"}
        </button>
      </form>

      <div className="flex flex-col gap-2">
        <p className="font-display text-xs font-semibold text-shihu-muted">
          Riwayat update ({updates.length})
        </p>
        {updates.length === 0 && (
          <p className="text-[12px] text-shihu-faint">Belum ada update untuk item ini.</p>
        )}
        {updates.map((u) => (
          <div key={u.id} className="bg-shihu-card border border-shihu-border rounded-xl p-3.5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10.5px] text-shihu-faint font-display">
                {u.createdAt.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
              </span>
              <form action={deleteOrderLineUpdate}>
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="orderLineId" value={orderLineId} />
                <button type="submit" className="text-[10.5px] text-red-400 font-display font-medium">
                  Hapus
                </button>
              </form>
            </div>
            {u.note && <p className="text-[13px] text-shihu-text">{u.note}</p>}
            {u.resetLocation && (
              <p className="text-[12px] text-shihu-muted">
                <span className="text-shihu-corona font-medium">Lokasi: </span>
                {u.resetLocation}
              </p>
            )}
            {u.screenshotUrl && (
              <a
                href={u.screenshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-shihu-corona underline break-all"
              >
                Lihat screenshot →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
