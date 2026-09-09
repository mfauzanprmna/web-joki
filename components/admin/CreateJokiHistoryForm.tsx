"use client";

import { useActionState, useEffect, useRef } from "react";
import { createJokiHistoryEntry, type JokiHistoryActionState } from "@/lib/actions/joki-history";
import { CustomerSelector, type CustomerOption } from "./CustomerSelector";

interface GameOption {
  id: string;
  name: string;
}

function todayInputValue(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function CreateJokiHistoryForm({ games, customers }: { games: GameOption[]; customers: CustomerOption[] }) {
  const [state, formAction, pending] = useActionState<JokiHistoryActionState | undefined, FormData>(
    createJokiHistoryEntry,
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
    <form
      ref={formRef}
      action={(formData) => {
        hasSubmittedRef.current = true;
        formAction(formData);
      }}
      className="flex flex-col gap-3 mt-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
            Game <span className="text-red-400">*</span>
          </label>
          <select name="gameId" required className="admin-input">
            <option value="" disabled>
              — Pilih game —
            </option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
            Judul joki <span className="text-red-400">*</span>
          </label>
          <input name="title" required className="admin-input" placeholder="mis. Push Rank Mythic" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CustomerSelector customers={customers} />
        <div>
          <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
            Nama joki (opsional)
          </label>
          <input name="jokerName" className="admin-input" placeholder="mis. Dimas" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
            Tanggal selesai
          </label>
          <input type="date" name="completedAt" defaultValue={todayInputValue()} className="admin-input" />
        </div>
        <div>
          <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
            Rating (1-5, opsional)
          </label>
          <input type="number" name="rating" min={1} max={5} className="admin-input" placeholder="mis. 5" />
        </div>
      </div>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Catatan (opsional)
        </label>
        <textarea
          name="note"
          rows={2}
          className="admin-input"
          placeholder="Ringkasan pengerjaan, kendala, dsb."
        />
      </div>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Link screenshot bukti (opsional, satu link per baris)
        </label>
        <textarea
          name="screenshotUrls"
          rows={3}
          className="admin-input font-mono text-[12px]"
          placeholder={"https://...\nhttps://..."}
        />
      </div>

      {state?.error && (
        <p className="text-[12px] text-red-400 bg-red-400/10 rounded-lg px-2.5 py-1.5">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start px-5 py-2.5 rounded-xl font-display font-semibold text-sm text-[#1A1206] bg-corona mt-1 disabled:opacity-60"
      >
        {pending ? "Menyimpan..." : "Tambah history joki"}
      </button>
    </form>
  );
}