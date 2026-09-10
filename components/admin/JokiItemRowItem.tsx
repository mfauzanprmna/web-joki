"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateJokiItem, deleteJokiItem, type JokiItemActionState } from "@/lib/actions/joki";
import { formatRupiah } from "@/lib/format";
import {
  JokiItemFormFields,
  type GameOption,
  type CategoryOption,
  type RegionOption,
  type QuestTypeOption,
  type PatchOption,
  type EndgameContentOption,
} from "./JokiItemFormFields";

interface JokiItemRow {
  id: string;
  title: string;
  description: string;
  priceRupiah: number;
  etaLabel: string;
  badge: string | null;
  isActive: boolean;
  gameId: string;
  categoryId: string;
  regionId: string | null;
  questTypeId: string | null;
  includeEvent: boolean;
  isPatchWide: boolean;
  patchId: string | null;
  actNumber: number | null;
  unitQuantity: number | null;
  durationDays: number | null;
  game: { name: string; accentColor: string };
  category: { name: string; isRawatAkun: boolean; isMaterial: boolean; requiresCharacterLevel: boolean };
  region: { name: string } | null;
  questType: { name: string } | null;
  patch: { name: string } | null;
  endgameContent: { endgameContentId: string }[];
}

interface JokiItemRowItemProps {
  item: JokiItemRow;
  games: GameOption[];
  categories: CategoryOption[];
  regions: RegionOption[];
  questTypes: QuestTypeOption[];
  patches: PatchOption[];
  endgameContents: EndgameContentOption[];
}

export function JokiItemRowItem({
  item,
  games,
  categories,
  regions,
  questTypes,
  patches,
  endgameContents,
}: JokiItemRowItemProps) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<JokiItemActionState | undefined, FormData>(
    updateJokiItem,
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
    const metaParts = [item.category.name, item.questType?.name, item.region?.name].filter(Boolean);
    if (item.questType && item.actNumber) metaParts.push(`Act ${item.actNumber}`);
    if (item.isPatchWide && item.patch) metaParts.push(`1 patch: ${item.patch.name}`);
    if (!item.isPatchWide && item.category.isRawatAkun && item.durationDays) metaParts.push(`${item.durationDays} hari/unit`);
    if (item.includeEvent) metaParts.push("include event");
    const priceLabel =
      item.category.isMaterial && item.unitQuantity
        ? `${formatRupiah(item.priceRupiah)} / ${item.unitQuantity}`
        : item.category.requiresCharacterLevel
          ? `${formatRupiah(item.priceRupiah)} / level`
          : formatRupiah(item.priceRupiah);
    return (
      <div className="bg-shihu-card border border-shihu-border rounded-2xl p-4 flex items-center gap-4 flex-wrap">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: item.game.accentColor }}
        />
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display text-sm font-semibold">{item.title}</p>
            {!item.isActive && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-400/15 text-red-400 font-display">
                Nonaktif
              </span>
            )}
            {item.badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-shihu-corona/15 text-shihu-corona font-display">
                {item.badge}
              </span>
            )}
          </div>
          <p className="text-shihu-muted text-xs mt-0.5">
            {item.game.name} · {metaParts.join(" · ")} · {priceLabel}
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
      <input type="hidden" name="id" value={item.id} />

      <JokiItemFormFields
        games={games}
        categories={categories}
        regions={regions}
        questTypes={questTypes}
        patches={patches}
        endgameContents={endgameContents}
        defaultValues={{
          gameId: item.gameId,
          categoryId: item.categoryId,
          regionId: item.regionId,
          questTypeId: item.questTypeId,
          includeEvent: item.includeEvent,
          isPatchWide: item.isPatchWide,
          patchId: item.patchId,
          endgameContentIds: item.endgameContent.map((e) => e.endgameContentId),
          actNumber: item.actNumber,
          unitQuantity: item.unitQuantity,
          durationDays: item.durationDays,
          priceRupiah: item.priceRupiah,
        }}
      />

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Badge (opsional)
        </label>
        <input
          name="badge"
          defaultValue={item.badge ?? ""}
          className="admin-input"
          placeholder="Populer / Baru"
        />
      </div>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Judul
        </label>
        <input
          name="title"
          defaultValue={item.title}
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
          defaultValue={item.description}
          required
          rows={2}
          className="admin-input"
        />
      </div>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Estimasi waktu
        </label>
        <input
          name="etaLabel"
          defaultValue={item.etaLabel}
          required
          className="admin-input"
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-shihu-muted font-display">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={item.isActive}
          className="accent-shihu-corona"
        />
        Tampilkan item ini ke customer
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
            fd.set("id", item.id);
            deleteJokiItem(fd);
          }}
          className="ml-auto px-4 py-2 rounded-xl font-display font-medium text-xs text-red-400 hover:bg-red-400/10"
        >
          Hapus
        </button>
      </div>
    </form>
  );
}
