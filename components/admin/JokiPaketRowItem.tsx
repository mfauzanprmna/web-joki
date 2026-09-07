"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateJokiPaket, deleteJokiPaket, type PaketActionState } from "@/lib/actions/paket";
import { formatRupiah } from "@/lib/format";
import { filterExplorationItems, filterQuestItemsByKind } from "@/lib/paket-rules";
import {
  JokiPaketFormFields,
  type RegionOption,
  type CategoryOption,
  type QuestTypeOption,
  type JokiItemOption,
} from "./JokiPaketFormFields";

interface JokiPaketRow {
  id: string;
  title: string;
  description: string;
  priceRupiah: number;
  regionId: string | null;
  isAllMapRegion: boolean;
  isActive: boolean;
  gameId: string;
  game: { name: string; accentColor: string };
  region: { name: string } | null;
  items: { jokiItemId: string; jokiItem: { title: string } }[];
}

interface JokiPaketRowItemProps {
  paket: JokiPaketRow;
  regions: RegionOption[];
  categories: CategoryOption[];
  questTypes: QuestTypeOption[];
  items: JokiItemOption[];
}

export function JokiPaketRowItem({ paket, regions, categories, questTypes, items }: JokiPaketRowItemProps) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<PaketActionState | undefined, FormData>(
    updateJokiPaket,
    undefined
  );
  const hasSubmittedRef = useRef(false);
  const [priceRupiah, setPriceRupiah] = useState<number>(paket.priceRupiah);
  const [priceTouched, setPriceTouched] = useState(false);

  useEffect(() => {
    if (hasSubmittedRef.current && !pending && !state?.error) {
      setEditing(false);
      hasSubmittedRef.current = false;
    }
  }, [pending, state]);

  if (!editing) {
    return (
      <div className="bg-shihu-card border border-shihu-border rounded-2xl p-4 flex items-center gap-4 flex-wrap">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: paket.game.accentColor }} />
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display text-sm font-semibold">{paket.title}</p>
            {!paket.isActive && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-400/15 text-red-400 font-display">
                Nonaktif
              </span>
            )}
            {paket.region && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-shihu-violet/15 text-shihu-violet font-display">
                {paket.region.name}
                {paket.isAllMapRegion ? " · All Map" : ""}
              </span>
            )}
          </div>
          <p className="text-shihu-muted text-xs mt-0.5">
            {paket.game.name} · {paket.items.length} item · {formatRupiah(paket.priceRupiah)}
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

  const paketItemIds = new Set(paket.items.map((i) => i.jokiItemId));
  const itemsInThisPaket = items.filter((i) => paketItemIds.has(i.id));

  const explorationIds = paket.regionId
    ? filterExplorationItems(itemsInThisPaket, categories, paket.regionId).map((i) => i.id)
    : [];
  const worldQuestIds = paket.regionId
    ? filterQuestItemsByKind(itemsInThisPaket, categories, questTypes, paket.regionId, "WORLD").map((i) => i.id)
    : [];
  const archonQuestIds = paket.regionId
    ? filterQuestItemsByKind(itemsInThisPaket, categories, questTypes, paket.regionId, "ARCHON").map((i) => i.id)
    : [];
  const classifiedIds = new Set([...explorationIds, ...worldQuestIds, ...archonQuestIds]);
  const baseIds = paket.items.map((i) => i.jokiItemId).filter((id) => !classifiedIds.has(id));

  return (
    <form
      action={(formData) => {
        hasSubmittedRef.current = true;
        formAction(formData);
      }}
      className="bg-shihu-card border border-shihu-corona/40 rounded-2xl p-4 flex flex-col gap-3"
    >
      <input type="hidden" name="id" value={paket.id} />
      <p className="font-display text-xs text-shihu-faint">
        {paket.game.name} (game tidak bisa diubah)
      </p>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Judul paket
        </label>
        <input
          name="title"
          defaultValue={paket.title}
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
          defaultValue={paket.description}
          required
          rows={2}
          className="admin-input"
        />
      </div>

      <JokiPaketFormFields
        gameId={paket.gameId}
        regions={regions}
        categories={categories}
        questTypes={questTypes}
        items={items}
        defaultValues={{
          regionId: paket.regionId,
          isAllMapRegion: paket.isAllMapRegion,
          baseItemIds: baseIds,
          explorationItemIds: explorationIds,
          worldQuestItemIds: worldQuestIds,
          archonQuestItemIds: archonQuestIds,
        }}
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
      </div>

      <label className="flex items-center gap-2 text-xs text-shihu-muted font-display">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={paket.isActive}
          className="accent-shihu-corona"
        />
        Tampilkan paket ini ke customer
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
            fd.set("id", paket.id);
            deleteJokiPaket(fd);
          }}
          className="ml-auto px-4 py-2 rounded-xl font-display font-medium text-xs text-red-400 hover:bg-red-400/10"
        >
          Hapus
        </button>
      </div>
    </form>
  );
}
