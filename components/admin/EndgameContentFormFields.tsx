"use client";

import { useState } from "react";
import { RESET_CYCLE_LABEL, type ResetCycle } from "@/lib/endgame-schedule";
import { toDateTimeLocalValue } from "@/lib/date-input";

const CYCLE_OPTIONS = Object.keys(RESET_CYCLE_LABEL) as ResetCycle[];

interface EndgameContentFormFieldsProps {
  defaultValues?: {
    resetCycle: ResetCycle;
    anchorStartDate: Date | null;
    daysAfterPatchStart: number | null;
  };
}

export function EndgameContentFormFields({ defaultValues }: EndgameContentFormFieldsProps) {
  const [resetCycle, setResetCycle] = useState<ResetCycle>(defaultValues?.resetCycle ?? "MINGGU_1");
  const isPatchCycle = resetCycle === "PATCH_1";

  return (
    <>
      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Siklus reset <span className="text-red-400">*</span>
        </label>
        <select
          name="resetCycle"
          required
          className="admin-input"
          value={resetCycle}
          onChange={(e) => setResetCycle(e.target.value as ResetCycle)}
        >
          {CYCLE_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {RESET_CYCLE_LABEL[c]}
            </option>
          ))}
        </select>
      </div>

      {isPatchCycle ? (
        <div>
          <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
            Mulai berapa hari setelah patch berganti <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            name="daysAfterPatchStart"
            min={0}
            required
            defaultValue={defaultValues?.daysAfterPatchStart ?? 0}
            className="admin-input"
            placeholder="mis. 3"
          />
          <p className="text-[11px] text-shihu-faint mt-1">
            Tanggal selesai otomatis mengikuti tanggal selesai patch yang sedang berjalan.
          </p>
        </div>
      ) : (
        <div>
          <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
            Tanggal mulai awal <span className="text-red-400">*</span>
          </label>
          <input
            type="datetime-local"
            name="anchorStartDate"
            required
            defaultValue={
              defaultValues?.anchorStartDate ? toDateTimeLocalValue(defaultValues.anchorStartDate) : undefined
            }
            className="admin-input"
          />
          <p className="text-[11px] text-shihu-faint mt-1">
            Reset berikutnya dihitung otomatis kelipatan periode dari tanggal ini.
          </p>
        </div>
      )}
    </>
  );
}
