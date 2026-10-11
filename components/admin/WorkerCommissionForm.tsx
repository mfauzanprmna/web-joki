"use client";

import { useActionState } from "react";
import { updateWorkerCommission, type SettingActionState } from "@/lib/actions/settings";
import { FaFloppyDisk } from "react-icons/fa6";

export function WorkerCommissionForm({ currentPercent }: { currentPercent: number }) {
  const [state, formAction, pending] = useActionState<SettingActionState | undefined, FormData>(
    updateWorkerCommission,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="max-w-[220px]">
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Komisi worker (% dari harga pesanan) <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <input
            name="percent"
            type="number"
            min={0}
            max={100}
            step={1}
            required
            defaultValue={currentPercent}
            className="admin-input pr-9"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-shihu-faint text-sm pointer-events-none">%</span>
        </div>
      </div>

      {state?.error && (
        <p className="text-[12px] text-red-400 bg-red-400/10 rounded-lg px-2.5 py-1.5">{state.error}</p>
      )}
      {state?.success && !pending && (
        <p className="text-[12px] text-emerald-400 bg-emerald-400/10 rounded-lg px-2.5 py-1.5">
          Komisi worker tersimpan.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="self-start flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-semibold text-sm text-[#1A1206] bg-corona disabled:opacity-60"
      >
        <FaFloppyDisk size={12} aria-hidden="true" />
        {pending ? "Menyimpan..." : "Simpan komisi"}
      </button>
    </form>
  );
}
