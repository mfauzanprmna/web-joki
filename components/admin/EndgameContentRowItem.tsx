"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateEndgameContent, deleteEndgameContent, type EndgameActionState } from "@/lib/actions/endgame";
import { formatRupiah } from "@/lib/format";
import { RESET_CYCLE_LABEL, type ResetCycle } from "@/lib/endgame-schedule";
import { EndgameContentFormFields } from "./EndgameContentFormFields";

interface EndgameContentRow {
  id: string;
  title: string;
  description: string;
  priceRupiah: number;
  resetCycle: ResetCycle;
  anchorStartDate: Date | null;
  daysAfterPatchStart: number | null;
  isActive: boolean;
  game: { name: string; accentColor: string };
}

export function EndgameContentRowItem({ content }: { content: EndgameContentRow }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<EndgameActionState | undefined, FormData>(
    updateEndgameContent,
    undefined
  );
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    if (hasSubmittedRef.current && !pending && !state?.error) {
      setEditing(false);
      hasSubmittedRef.current = false;
    }
  }, [pending, state]);

  if (!editing) {
    return (
      <div className="bg-shihu-card border border-shihu-border rounded-2xl p-4 flex items-center gap-4 flex-wrap">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: content.game.accentColor }} />
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display text-sm font-semibold">{content.title}</p>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2C2540] text-shihu-muted font-display">
              {RESET_CYCLE_LABEL[content.resetCycle]}
            </span>
            {!content.isActive && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-400/15 text-red-400 font-display">
                Nonaktif
              </span>
            )}
          </div>
          <p className="text-shihu-muted text-xs mt-0.5">
            {content.game.name} · {formatRupiah(content.priceRupiah)}
          </p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="px-3 py-1.5 rounded-lg text-xs font-display font-medium border border-shihu-borderSoft text-shihu-text hover:bg-[#2C2540]"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <form
      action={(formData) => {
        hasSubmittedRef.current = true;
        formAction(formData);
      }}
      className="bg-shihu-card border border-shihu-corona/40 rounded-2xl p-4 flex flex-col gap-3"
    >
      <input type="hidden" name="id" value={content.id} />
      <p className="font-display text-xs text-shihu-faint">
        {content.game.name}
      </p>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Judul konten
        </label>
        <input
          name="title"
          defaultValue={content.title}
          required
          className="admin-input"
        />
      </div>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Deskripsi
        </label>
        <textarea
          name="description"
          defaultValue={content.description}
          required
          rows={2}
          className="admin-input"
        />
      </div>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Harga (Rp)
        </label>
        <input
          type="number"
          name="priceRupiah"
          defaultValue={content.priceRupiah}
          required
          min={0}
          className="admin-input"
        />
      </div>

      <EndgameContentFormFields
        defaultValues={{
          resetCycle: content.resetCycle,
          anchorStartDate: content.anchorStartDate,
          daysAfterPatchStart: content.daysAfterPatchStart,
        }}
      />

      <label className="flex items-center gap-2 text-xs text-shihu-muted font-display">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={content.isActive}
          className="accent-shihu-corona"
        />
        Konten aktif (bisa dipilih di Joki Item Rawat Akun)
      </label>

      {state?.error && (
        <p className="text-[13px] text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 rounded-xl font-display font-semibold text-xs text-[#1A1206] bg-corona disabled:opacity-60"
        >
          {pending ? "Menyimpan..." : "Simpan"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="px-4 py-2 rounded-xl font-display font-medium text-xs border border-shihu-borderSoft"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={() => {
            const fd = new FormData();
            fd.set("id", content.id);
            deleteEndgameContent(fd);
          }}
          className="ml-auto px-4 py-2 rounded-xl font-display font-medium text-xs text-red-400 hover:bg-red-400/10"
        >
          Hapus
        </button>
      </div>
    </form>
  );
}
