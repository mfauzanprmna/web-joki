"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createJokiItem, type JokiItemActionState } from "@/lib/actions/joki";
import {
  JokiItemFormFields,
  type GameOption,
  type CategoryOption,
  type RegionOption,
  type QuestTypeOption,
  type PatchOption,
  type EndgameContentOption,
} from "./JokiItemFormFields";

interface CreateJokiItemFormProps {
  games: GameOption[];
  categories: CategoryOption[];
  regions: RegionOption[];
  questTypes: QuestTypeOption[];
  patches: PatchOption[];
  endgameContents: EndgameContentOption[];
}

export function CreateJokiItemForm({
  games,
  categories,
  regions,
  questTypes,
  patches,
  endgameContents,
}: CreateJokiItemFormProps) {
  const [state, formAction, pending] = useActionState<JokiItemActionState | undefined, FormData>(
    createJokiItem,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [formKey, setFormKey] = useState(0);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    if (hasSubmittedRef.current && !pending && !state?.error) {
      formRef.current?.reset();
      setFormKey((k) => k + 1); // reset state internal JokiItemFormFields
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
      <JokiItemFormFields
        key={formKey}
        games={games}
        categories={categories}
        regions={regions}
        questTypes={questTypes}
        patches={patches}
        endgameContents={endgameContents}
      />

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Badge (opsional)
        </label>
        <input name="badge" className="admin-input" placeholder="Populer / Baru" />
      </div>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Judul
        </label>
        <input name="title" required className="admin-input" placeholder="Push rank Spiral Abyss 12★" />
      </div>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Deskripsi
        </label>
        <textarea
          name="description"
          required
          rows={2}
          className="admin-input"
          placeholder="Full clear 36 bintang, garansi selesai 1-2 hari"
        />
      </div>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Estimasi waktu
        </label>
        <input name="etaLabel" required className="admin-input" placeholder="±1-2 hari" />
      </div>

      {state?.error && (
        <p className="text-[13px] text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start px-5 py-2.5 rounded-xl font-display font-semibold text-sm text-[#1A1206] bg-corona mt-1 disabled:opacity-60"
      >
        {pending ? "Menyimpan..." : "Tambah joki item"}
      </button>
    </form>
  );
}
