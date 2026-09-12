"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculatePaketPrice,
  filterExplorationItems,
  filterQuestItemsByKind,
  type JokiItemForPaket,
  type CategoryForPaket,
  type QuestTypeForPaket,
} from "@/lib/paket-rules";

export interface RegionOption {
  id: string;
  gameId: string;
  name: string;
  isActive: boolean;
}

export interface CategoryOption extends CategoryForPaket {
  gameId: string;
  name: string;
  isActive: boolean;
}

export interface QuestTypeOption extends QuestTypeForPaket {
  gameId: string;
  name: string;
  isActive: boolean;
}

export interface JokiItemOption extends JokiItemForPaket {
  gameId: string;
  title: string;
}

interface JokiPaketFormFieldsProps {
  gameId: string;
  regions: RegionOption[];
  categories: CategoryOption[];
  questTypes: QuestTypeOption[];
  items: JokiItemOption[];
  defaultValues?: {
    regionId?: string | null;
    isAllMapRegion?: boolean;
    baseItemIds?: string[]; // item non-eksplorasi/quest yang dipilih manual
    explorationItemIds?: string[];
    worldQuestItemIds?: string[];
    archonQuestItemIds?: string[];
    questActRanges?: Record<string, { actFrom: number | null; actTo: number | null }>;
  };
  onPriceSuggestionChange?: (price: number) => void;
}

export function JokiPaketFormFields({
  gameId,
  regions,
  categories,
  questTypes,
  items,
  defaultValues,
  onPriceSuggestionChange,
}: JokiPaketFormFieldsProps) {
  const [regionId, setRegionId] = useState(defaultValues?.regionId ?? "");
  const [isAllMapRegion, setIsAllMapRegion] = useState(defaultValues?.isAllMapRegion ?? false);
  const [selectedBaseIds, setSelectedBaseIds] = useState<Set<string>>(
    new Set(defaultValues?.baseItemIds ?? [])
  );
  const [selectedExplorationIds, setSelectedExplorationIds] = useState<Set<string>>(
    new Set(defaultValues?.explorationItemIds ?? [])
  );
  const [selectedWorldQuestIds, setSelectedWorldQuestIds] = useState<Set<string>>(
    new Set(defaultValues?.worldQuestItemIds ?? [])
  );
  const [selectedArchonQuestIds, setSelectedArchonQuestIds] = useState<Set<string>>(
    new Set(defaultValues?.archonQuestItemIds ?? [])
  );
  const [questActRanges, setQuestActRanges] = useState<Record<string, { actFrom: string; actTo: string }>>(
    Object.fromEntries(
      Object.entries(defaultValues?.questActRanges ?? {}).map(([id, range]) => [id, {
        actFrom: String(range.actFrom ?? 1),
        actTo: String(range.actTo ?? 1),
      }])
    )
  );

  const regionsForGame = useMemo(() => regions.filter((r) => r.gameId === gameId && r.isActive), [regions, gameId]);
  const itemsForGame = useMemo(() => items.filter((i) => i.gameId === gameId), [items, gameId]);
  const categoriesForGame = useMemo(
    () => categories.filter((c) => c.gameId === gameId && c.isActive),
    [categories, gameId]
  );
  const questTypesForGame = useMemo(
    () => questTypes.filter((q) => q.gameId === gameId && q.isActive),
    [questTypes, gameId]
  );

  const explorationItems = useMemo(
    () => (regionId ? filterExplorationItems(itemsForGame, categoriesForGame, regionId) : []),
    [itemsForGame, categoriesForGame, regionId]
  );
  const worldQuestItems = useMemo(
    () => (regionId ? filterQuestItemsByKind(itemsForGame, categoriesForGame, questTypesForGame, regionId, "WORLD") : []),
    [itemsForGame, categoriesForGame, questTypesForGame, regionId]
  );
  const archonQuestItems = useMemo(
    () => (regionId ? filterQuestItemsByKind(itemsForGame, categoriesForGame, questTypesForGame, regionId, "ARCHON") : []),
    [itemsForGame, categoriesForGame, questTypesForGame, regionId]
  );

  // Item lain yang bisa dipilih manual sebagai basis paket — kecualikan item
  // yang sudah otomatis termasuk lewat All Map (supaya tidak muncul dobel di
  // checklist berbeda dan membingungkan admin).
  const baseSelectableItems = useMemo(() => {
    if (!isAllMapRegion) return itemsForGame;
    const autoIncludedIds = new Set([
      ...explorationItems.map((i) => i.id),
      ...worldQuestItems.map((i) => i.id),
    ]);
    return itemsForGame.filter((i) => !autoIncludedIds.has(i.id));
  }, [itemsForGame, isAllMapRegion, explorationItems, worldQuestItems]);

  function isQuestItem(item: JokiItemOption) {
    return categoriesForGame.some((category) => category.id === item.categoryId && category.requiresQuestType);
  }

  function updateQuestAct(itemId: string, field: "actFrom" | "actTo", value: string) {
    setQuestActRanges((current) => ({
      ...current,
      [itemId]: { ...(current[itemId] ?? { actFrom: "1", actTo: "1" }), [field]: value },
    }));
  }

  // All Map ON -> World Quest ikut otomatis on (terkunci); saat toggle All Map
  // dimatikan, World Quest kembali ke pilihan manual (checklist).
  useEffect(() => {
    if (isAllMapRegion) {
      setSelectedWorldQuestIds(new Set(worldQuestItems.map((i) => i.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAllMapRegion, regionId]);

  function handleRegionChange(newRegionId: string) {
    setRegionId(newRegionId);
    setIsAllMapRegion(false);
    setSelectedExplorationIds(new Set());
    setSelectedWorldQuestIds(new Set());
    setSelectedArchonQuestIds(new Set());
  }

  function toggleSelection(set: Set<string>, setFn: (s: Set<string>) => void, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFn(next);
  }

  // Rekalkulasi saran harga setiap kombinasi pilihan berubah.
  useEffect(() => {
    if (!onPriceSuggestionChange) return;
    const selectedIds = new Set<string>([
      ...selectedBaseIds,
      ...(isAllMapRegion ? explorationItems.map((i) => i.id) : selectedExplorationIds),
      ...(isAllMapRegion ? worldQuestItems.map((i) => i.id) : selectedWorldQuestIds),
      ...selectedArchonQuestIds,
    ]);
    const selectedItems = itemsForGame.filter((i) => selectedIds.has(i.id));
    onPriceSuggestionChange(calculatePaketPrice(selectedItems));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBaseIds, selectedExplorationIds, selectedWorldQuestIds, selectedArchonQuestIds, isAllMapRegion, explorationItems, worldQuestItems]);

  return (
    <>
      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Region (opsional)
        </label>
        <select
          name="regionId"
          className="admin-input"
          value={regionId}
          onChange={(e) => handleRegionChange(e.target.value)}
        >
          <option value="">— Tidak terikat region —</option>
          {regionsForGame.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-shihu-faint mt-1">
          Isi region jika paket ini juga mencakup layanan Eksplorasi untuk region tersebut.
        </p>
      </div>

      {regionId && (
        <div className="flex flex-col gap-3 bg-shihu-violet/5 border border-shihu-violet/25 rounded-xl p-3.5">
          <label className="flex items-center justify-between gap-2 text-xs text-shihu-text font-display bg-[#241E38] rounded-xl px-3.5 py-3 border border-shihu-border">
            <span>
              All Map Region
              <span className="block text-[11px] text-shihu-faint font-normal mt-0.5">
                Semua map & World Quest region ini otomatis tercakup. Archon Quest tetap dipilih manual.
              </span>
            </span>
            <input
              type="checkbox"
              name="isAllMapRegion"
              checked={isAllMapRegion}
              onChange={(e) => setIsAllMapRegion(e.target.checked)}
              className="accent-shihu-corona w-4 h-4 shrink-0"
            />
          </label>

          {!isAllMapRegion && (
            <>
              <ItemChecklist
                label="Map eksplorasi yang masuk"
                items={explorationItems}
                selected={selectedExplorationIds}
                onToggle={(id) => toggleSelection(selectedExplorationIds, setSelectedExplorationIds, id)}
                inputName="itemIds"
                emptyText="Belum ada Joki Item kategori Eksplorasi untuk region ini."
                isQuestItem={isQuestItem}
                questActRanges={questActRanges}
                onQuestActChange={updateQuestAct}
              />
              <ItemChecklist
                label="World Quest yang masuk"
                items={worldQuestItems}
                selected={selectedWorldQuestIds}
                onToggle={(id) => toggleSelection(selectedWorldQuestIds, setSelectedWorldQuestIds, id)}
                inputName="itemIds"
                emptyText="Belum ada World Quest untuk region ini."
                isQuestItem={isQuestItem}
                questActRanges={questActRanges}
                onQuestActChange={updateQuestAct}
              />
            </>
          )}

          {isAllMapRegion && worldQuestItems.length > 0 && (
            <div>
              <p className="text-[11.5px] font-display font-medium text-shihu-muted mb-1">
                World Quest (otomatis tercakup, tidak bisa diubah)
              </p>
              <div className="flex flex-col gap-1 bg-[#241E38] rounded-xl border border-shihu-border p-2.5">
                {worldQuestItems.map((i) => (
                  <div key={i.id}>
                    <p className="text-xs text-shihu-muted px-1 py-0.5">✓ {i.title}</p>
                    {isQuestItem(i) && <QuestActInputs itemId={i.id} ranges={questActRanges} onChange={updateQuestAct} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          <ItemChecklist
            label="Archon Quest yang masuk (selalu manual)"
            items={archonQuestItems}
            selected={selectedArchonQuestIds}
            onToggle={(id) => toggleSelection(selectedArchonQuestIds, setSelectedArchonQuestIds, id)}
            inputName="archonQuestItemIds"
            emptyText="Belum ada Archon Quest untuk region ini."
            isQuestItem={isQuestItem}
            questActRanges={questActRanges}
            onQuestActChange={updateQuestAct}
          />
        </div>
      )}

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Joki Item lain dalam paket ini
        </label>
        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto bg-[#241E38] rounded-xl border border-shihu-border p-2.5">
          {baseSelectableItems.length === 0 && (
            <p className="text-[11px] text-shihu-faint px-1 py-1">Belum ada Joki Item untuk game ini.</p>
          )}
          {baseSelectableItems.map((i) => (
            <div key={i.id}>
              <label className="flex items-center gap-2 text-xs text-shihu-text px-1 py-1">
                <input type="checkbox" name="itemIds" value={i.id} checked={selectedBaseIds.has(i.id)} onChange={() => toggleSelection(selectedBaseIds, setSelectedBaseIds, i.id)} className="accent-shihu-corona w-3.5 h-3.5 shrink-0" />
                {i.title}
              </label>
              {selectedBaseIds.has(i.id) && isQuestItem(i) && (
                <QuestActInputs itemId={i.id} ranges={questActRanges} onChange={updateQuestAct} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Saat All Map aktif, eksplorasi & world quest tidak ditampilkan sebagai
          checklist manual, tapi tetap dikirim utuh via hidden input supaya
          data JokiPaketItem yang tersimpan selalu lengkap & konsisten —
          memudahkan halaman customer menampilkan isi paket tanpa perlu
          menghitung ulang "apa saja yang termasuk" dari flag isAllMapRegion. */}
      {isAllMapRegion &&
        explorationItems.map((i) => <input key={i.id} type="hidden" name="itemIds" value={i.id} />)}
      {isAllMapRegion &&
        worldQuestItems.map((i) => <input key={i.id} type="hidden" name="itemIds" value={i.id} />)}

      {/* Selalu render sebagai pengaman: memastikan field "itemIds" tetap ada di
          form meski tidak ada satupun checkbox/hidden lain yang checked. Value
          kosong ini otomatis tersaring oleh .filter(Boolean) di server action. */}
      <input type="hidden" name="itemIds" value="" />
    </>
  );
}

function ItemChecklist({
  label,
  items,
  selected,
  onToggle,
  inputName,
  emptyText,
  isQuestItem,
  questActRanges,
  onQuestActChange,
}: {
  label: string;
  items: JokiItemOption[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  inputName: string;
  emptyText: string;
  isQuestItem: (item: JokiItemOption) => boolean;
  questActRanges: Record<string, { actFrom: string; actTo: string }>;
  onQuestActChange: (itemId: string, field: "actFrom" | "actTo", value: string) => void;
}) {
  return (
    <div>
      <p className="text-[11.5px] font-display font-medium text-shihu-muted mb-1">{label}</p>
      <div className="flex flex-col gap-1 bg-[#241E38] rounded-xl border border-shihu-border p-2.5 max-h-36 overflow-y-auto">
        {items.length === 0 && <p className="text-[11px] text-shihu-faint px-1 py-1">{emptyText}</p>}
        {items.map((i) => (
          <div key={i.id}>
            <label className="flex items-center gap-2 text-xs text-shihu-text px-1 py-0.5">
              <input type="checkbox" name={inputName} value={i.id} checked={selected.has(i.id)} onChange={() => onToggle(i.id)} className="accent-shihu-corona w-3.5 h-3.5 shrink-0" />
              {i.title}
            </label>
            {selected.has(i.id) && isQuestItem(i) && <QuestActInputs itemId={i.id} ranges={questActRanges} onChange={onQuestActChange} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function QuestActInputs({
  itemId,
  ranges,
  onChange,
}: {
  itemId: string;
  ranges: Record<string, { actFrom: string; actTo: string }>;
  onChange: (itemId: string, field: "actFrom" | "actTo", value: string) => void;
}) {
  const range = ranges[itemId] ?? { actFrom: "1", actTo: "1" };
  return (
    <div className="grid grid-cols-2 gap-2 pl-6 pb-1">
      <label className="text-[10px] text-shihu-muted">Act mulai<input type="number" min={1} name={`questActFrom:${itemId}`} value={range.actFrom} onChange={(e) => onChange(itemId, "actFrom", e.target.value)} className="admin-input mt-1" /></label>
      <label className="text-[10px] text-shihu-muted">Act selesai<input type="number" min={1} name={`questActTo:${itemId}`} value={range.actTo} onChange={(e) => onChange(itemId, "actTo", e.target.value)} className="admin-input mt-1" /></label>
    </div>
  );
}
