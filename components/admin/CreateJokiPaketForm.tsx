"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createJokiPaket, type PaketActionState } from "@/lib/actions/paket";
import {
  JokiPaketFormFields,
  type RegionOption,
  type CategoryOption,
  type QuestTypeOption,
  type JokiItemOption,
} from "./JokiPaketFormFields";

interface GameOption {
  id: string;
  name: string;
}

interface CreateJokiPaketFormProps {
  games: GameOption[];
  regions: RegionOption[];
  categories: CategoryOption[];
  questTypes: QuestTypeOption[];
  items: JokiItemOption[];
}

export function CreateJokiPaketForm({ games, regions, categories, questTypes, items }: CreateJokiPaketFormProps) {
  const [state, formAction, pending] = useActionState<PaketActionState | undefined, FormData>(
    createJokiPaket,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [formKey, setFormKey] = useState(0);
  const hasSubmittedRef = useRef(false);

  const [gameId, setGameId] = useState(games[0]?.id ?? "");
  const [priceRupiah, setPriceRupiah] = useState<number>(0);
  const [priceTouched, setPriceTouched] = useState(false);

  useEffect(() => {
    if (hasSubmittedRef.current && !pending && !state?.error) {
      formRef.current?.reset();
      setFormKey((k) => k + 1);
      setPriceRupiah(0);
      setPriceTouched(false);
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
        <select
          name="gameId"
          required
          className="admin-input"
          value={gameId}
          onChange={(e) => {
            setGameId(e.target.value);
            setFormKey((k) => k + 1); // reset pilihan item saat ganti game
          }}
        >
          {games.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Judul paket
        </label>
        <input name="title" required className="admin-input" placeholder="Paket Lengkap Mondstadt" />
      </div>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Deskripsi
        </label>
        <textarea name="description" required rows={2} className="admin-input" placeholder="Paket lengkap eksplorasi + quest region Mondstadt" />
      </div>

      <JokiPaketFormFields
        key={formKey}
        gameId={gameId}
        regions={regions}
        categories={categories}
        questTypes={questTypes}
        items={items}
        onPriceSuggestionChange={(suggested) => {
          if (!priceTouched) setPriceRupiah(suggested);
        }}
      />

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Harga paket (Rp)
        </label>
        <input
          type="number"
          name="priceRupiah"
          min={0}
          required
          value={priceRupiah}
          onChange={(e) => {
            setPriceTouched(true);
            setPriceRupiah(Number(e.target.value));
          }}
          className="admin-input"
        />
        <p className="text-[11px] text-shihu-faint mt-1">
          Terisi otomatis dari total harga item yang dipilih — bisa diubah manual kapan saja.
        </p>
      </div>

      {state?.error && (
        <p className="text-[13px] text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start px-5 py-2.5 rounded-xl font-display font-semibold text-sm text-[#1A1206] bg-corona mt-1 disabled:opacity-60"
      >
        {pending ? "Menyimpan..." : "Tambah paket"}
      </button>
    </form>
  );
}
