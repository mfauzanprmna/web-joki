"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createEndgameContent, type EndgameActionState } from "@/lib/actions/endgame";
import { EndgameContentFormFields } from "./EndgameContentFormFields";

interface GameOption {
  id: string;
  name: string;
}

export function CreateEndgameContentForm({ games }: { games: GameOption[] }) {
  const [state, formAction, pending] = useActionState<EndgameActionState | undefined, FormData>(
    createEndgameContent,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [formKey, setFormKey] = useState(0);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    if (hasSubmittedRef.current && !pending && !state?.error) {
      formRef.current?.reset();
      setFormKey((k) => k + 1);
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
          Judul konten
        </label>
        <input name="title" required className="admin-input" placeholder="Farming mingguan boss" />
      </div>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Deskripsi
        </label>
        <textarea name="description" required rows={2} className="admin-input" placeholder="Farming resin harian + boss mingguan" />
      </div>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Harga (Rp)
        </label>
        <input type="number" name="priceRupiah" required min={0} className="admin-input" placeholder="50000" />
      </div>

      <EndgameContentFormFields key={formKey} />

      {state?.error && (
        <p className="text-[13px] text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start px-5 py-2.5 rounded-xl font-display font-semibold text-sm text-[#1A1206] bg-corona mt-1 disabled:opacity-60"
      >
        {pending ? "Menyimpan..." : "Tambah konten endgame"}
      </button>
    </form>
  );
}
