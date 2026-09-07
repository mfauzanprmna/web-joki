"use client";

import { useActionState, useEffect, useRef } from "react";
import { createPatch, type PatchActionState } from "@/lib/actions/patch";

interface GameOption {
  id: string;
  name: string;
}

export function CreatePatchForm({ games }: { games: GameOption[] }) {
  const [state, formAction, pending] = useActionState<PatchActionState | undefined, FormData>(
    createPatch,
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
      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Game
        </label>
        <select name="gameId" required className="admin-input">
          {games.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Nama patch
        </label>
        <input name="name" required className="admin-input" placeholder="Patch 5.0" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
            Tanggal mulai
          </label>
          <input type="datetime-local" name="startDate" required className="admin-input" />
        </div>
        <div>
          <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
            Tanggal selesai
          </label>
          <input type="datetime-local" name="endDate" required className="admin-input" />
        </div>
      </div>

      {state?.error && (
        <p className="text-[13px] text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start px-5 py-2.5 rounded-xl font-display font-semibold text-sm text-[#1A1206] bg-corona mt-1 disabled:opacity-60"
      >
        {pending ? "Menyimpan..." : "Tambah patch"}
      </button>
    </form>
  );
}
