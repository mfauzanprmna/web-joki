"use client";

import { useMemo, useState } from "react";
import { isRegionRequired, isQuestTypeRequired } from "@/lib/joki-rules";

export interface GameOption {
  id: string;
  name: string;
}

export interface CategoryOption {
  id: string;
  gameId: string;
  name: string;
  requiresRegion: boolean;
  requiresQuestType: boolean;
  isRawatAkun: boolean;
  isMaterial: boolean;
  isActive: boolean;
}

export interface RegionOption {
  id: string;
  gameId: string;
  name: string;
  isActive: boolean;
}

export interface QuestTypeOption {
  id: string;
  gameId: string;
  name: string;
  isRegionSpecific: boolean;
  isActive: boolean;
}

export interface PatchOption {
  id: string;
  gameId: string;
  name: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
}

export interface EndgameContentOption {
  id: string;
  gameId: string;
  title: string;
  resetCycle: string;
  isActive: boolean;
}

interface JokiItemFormFieldsProps {
  games: GameOption[];
  categories: CategoryOption[];
  regions: RegionOption[];
  questTypes: QuestTypeOption[];
  patches: PatchOption[];
  endgameContents: EndgameContentOption[];
  defaultValues?: {
    gameId: string;
    categoryId: string;
    regionId: string | null;
    questTypeId: string | null;
    includeEvent?: boolean;
    isPatchWide?: boolean;
    patchId?: string | null;
    endgameContentIds?: string[];
    actNumber?: number | null;
    unitQuantity?: number | null;
    durationDays?: number | null;
    priceRupiah?: number;
  };
}

export function JokiItemFormFields({
  games,
  categories,
  regions,
  questTypes,
  patches,
  endgameContents,
  defaultValues,
}: JokiItemFormFieldsProps) {
  const [gameId, setGameId] = useState(defaultValues?.gameId ?? games[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(defaultValues?.categoryId ?? "");
  const [questTypeId, setQuestTypeId] = useState(defaultValues?.questTypeId ?? "");
  const [isPatchWide, setIsPatchWide] = useState(defaultValues?.isPatchWide ?? false);

  const categoriesForGame = useMemo(
    () => categories.filter((c) => c.gameId === gameId && c.isActive),
    [categories, gameId]
  );
  const regionsForGame = useMemo(
    () => regions.filter((r) => r.gameId === gameId && r.isActive),
    [regions, gameId]
  );
  const questTypesForGame = useMemo(
    () => questTypes.filter((q) => q.gameId === gameId && q.isActive),
    [questTypes, gameId]
  );
  const patchesForGame = useMemo(
    () => patches.filter((p) => p.gameId === gameId),
    [patches, gameId]
  );
  const endgameContentsForGame = useMemo(
    () => endgameContents.filter((e) => e.gameId === gameId && e.isActive),
    [endgameContents, gameId]
  );

  const selectedCategory = categoriesForGame.find((c) => c.id === categoryId) ?? null;
  const selectedQuestType = questTypesForGame.find((q) => q.id === questTypeId) ?? null;

  const questTypeNeeded = selectedCategory ? isQuestTypeRequired(selectedCategory) : false;
  const regionNeeded = selectedCategory
    ? isRegionRequired(selectedCategory, selectedQuestType)
    : false;
  const rawatAkunNeeded = selectedCategory?.isRawatAkun ?? false;
  const materialNeeded = selectedCategory?.isMaterial ?? false;

  function handleGameChange(newGameId: string) {
    setGameId(newGameId);
    setCategoryId("");
    setQuestTypeId("");
  }

  function handleCategoryChange(newCategoryId: string) {
    setCategoryId(newCategoryId);
    setQuestTypeId("");
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
            Game <span className="text-red-400">*</span>
          </label>
          <select
            name="gameId"
            required
            className="admin-input"
            value={gameId}
            onChange={(e) => handleGameChange(e.target.value)}
          >
            <option value="" disabled>
              — Pilih game —
            </option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
            Kategori <span className="text-red-400">*</span>
          </label>
          <select
            name="categoryId"
            required
            className="admin-input"
            value={categoryId}
            onChange={(e) => handleCategoryChange(e.target.value)}
            disabled={!gameId}
          >
            <option value="" disabled>
              {gameId ? "— Pilih kategori —" : "Pilih game dulu"}
            </option>
            {categoriesForGame.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {questTypeNeeded && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
              Jenis quest <span className="text-red-400">*</span>
            </label>
            <select
              name="questTypeId"
              required
              className="admin-input"
              value={questTypeId}
              onChange={(e) => setQuestTypeId(e.target.value)}
            >
              <option value="" disabled>
                — Pilih jenis quest —
              </option>
              {questTypesForGame.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.name}
                  {q.isRegionSpecific ? " (spesifik region)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
              Act
            </label>
            <input
              type="number"
              name="actNumber"
              min={1}
              defaultValue={defaultValues?.actNumber ?? 1}
              className="admin-input"
            />
          </div>
        </div>
      )}

      {regionNeeded && (
        <div>
          <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
            Region <span className="text-red-400">*</span>
          </label>
          <select name="regionId" required className="admin-input" defaultValue={defaultValues?.regionId ?? ""}>
            <option value="" disabled>
              — Pilih region —
            </option>
            {regionsForGame.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {materialNeeded ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
              Harga per jumlah (Rp) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              name="priceRupiah"
              min={0}
              required
              defaultValue={defaultValues?.priceRupiah}
              className="admin-input"
              placeholder="10000"
            />
          </div>
          <div>
            <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
              Jumlah material <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              name="unitQuantity"
              min={1}
              required
              defaultValue={defaultValues?.unitQuantity ?? 100}
              className="admin-input"
              placeholder="100"
            />
          </div>
          <p className="text-[11px] text-shihu-faint col-span-2 -mt-1.5">
            Harga berlaku per jumlah ini, mis. Rp 10.000 / 100 material.
          </p>
        </div>
      ) : (
        <div>
          <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
            Harga (Rp) <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            name="priceRupiah"
            min={0}
            required
            defaultValue={defaultValues?.priceRupiah}
            className="admin-input"
            placeholder="85000"
          />
        </div>
      )}

      {!questTypeNeeded && (
        // Pastikan field tetap terkirim kosong kalau sebelumnya sempat terisi lalu kategori diganti.
        <input type="hidden" name="questTypeId" value="" />
      )}
      {!regionNeeded && <input type="hidden" name="regionId" value="" />}
      {!materialNeeded && <input type="hidden" name="unitQuantity" value="" />}
      {(!rawatAkunNeeded || isPatchWide) && <input type="hidden" name="durationDays" value="" />}

      {rawatAkunNeeded && (
        <div className="flex flex-col gap-3 bg-shihu-violet/5 border border-shihu-violet/25 rounded-xl p-3.5">
          <p className="font-display text-xs font-semibold text-shihu-violet">
            Pengaturan Rawat Akun
          </p>

          <label className="flex items-center justify-between gap-2 text-xs text-shihu-text font-display bg-[#241E38] rounded-xl px-3.5 py-3 border border-shihu-border">
            <span>
              Include event
              <span className="block text-[11px] text-shihu-faint font-normal mt-0.5">
                Paket ini otomatis mencakup event patch yang sedang berjalan
              </span>
            </span>
            <input
              type="checkbox"
              name="includeEvent"
              defaultChecked={defaultValues?.includeEvent}
              className="accent-shihu-corona w-4 h-4 shrink-0"
            />
          </label>

          <label className="flex items-center justify-between gap-2 text-xs text-shihu-text font-display bg-[#241E38] rounded-xl px-3.5 py-3 border border-shihu-border">
            <span>
              Rawat akun 1 patch
              <span className="block text-[11px] text-shihu-faint font-normal mt-0.5">
                Terikat ke satu Patch penuh (bukan konten endgame tertentu). Tampil sejak Patch dibuat, hilang H+1 setelah patch mulai.
              </span>
            </span>
            <input
              type="checkbox"
              name="isPatchWide"
              checked={isPatchWide}
              onChange={(e) => setIsPatchWide(e.target.checked)}
              className="accent-shihu-corona w-4 h-4 shrink-0"
            />
          </label>

          {isPatchWide ? (
            <div>
              <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
                Patch <span className="text-red-400">*</span>
              </label>
              <select
                name="patchId"
                required
                className="admin-input"
                defaultValue={defaultValues?.patchId ?? ""}
                disabled={!gameId}
              >
                <option value="" disabled>
                  {gameId ? "— Pilih patch —" : "Pilih game dulu"}
                </option>
                {patchesForGame.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
                  Durasi per 1 unit (hari) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="durationDays"
                  min={1}
                  required
                  defaultValue={defaultValues?.durationDays ?? undefined}
                  className="admin-input"
                  placeholder="mis. 7 (untuk Rawat Akun Mingguan)"
                />
                <p className="text-[11px] text-shihu-faint mt-1">
                  Dipakai menghitung tanggal selesai otomatis saat order dibuat: durasi x jumlah yang dipesan customer. Mis. durasi 7 hari x 2 unit = 14 hari.
                </p>
              </div>
              <div>
                <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
                  Konten endgame yang dicakup
                </label>
                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto bg-[#241E38] rounded-xl border border-shihu-border p-2.5">
                  {endgameContentsForGame.length === 0 && (
                    <p className="text-[11px] text-shihu-faint px-1 py-1">
                      Belum ada konten endgame untuk game ini.
                    </p>
                  )}
                  {endgameContentsForGame.map((e) => (
                    <label key={e.id} className="flex items-center gap-2 text-xs text-shihu-text px-1 py-1">
                      <input
                        type="checkbox"
                        name="endgameContentIds"
                        value={e.id}
                        defaultChecked={defaultValues?.endgameContentIds?.includes(e.id)}
                        className="accent-shihu-corona w-3.5 h-3.5 shrink-0"
                      />
                      {e.title}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
