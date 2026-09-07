"use client";

import { useState } from "react";
import { updateJokiCategory, deleteJokiCategory } from "@/lib/actions/joki";

interface GameOption {
  id: string;
  name: string;
  accentColor: string;
}

interface CategoryRow {
  id: string;
  name: string;
  requiresRegion: boolean;
  requiresQuestType: boolean;
  isRawatAkun: boolean;
  isMaterial: boolean;
  isActive: boolean;
  game: GameOption;
}

export function JokiCategoryRowItem({ category }: { category: CategoryRow }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="bg-shihu-card border border-shihu-border rounded-2xl p-4 flex items-center gap-4 flex-wrap">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: category.game.accentColor }}
        />
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display text-sm font-semibold">{category.name}</p>
            {category.isRawatAkun && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-shihu-violet/15 text-shihu-violet font-display">
                Rawat Akun
              </span>
            )}
            {category.isMaterial && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-shihu-corona/15 text-shihu-corona font-display">
                Material
              </span>
            )}
            {!category.isActive && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-400/15 text-red-400 font-display">
                Nonaktif
              </span>
            )}
          </div>
          <p className="text-shihu-muted text-xs mt-0.5">
            {category.game.name}
            {category.requiresRegion && " · butuh Region"}
            {category.requiresQuestType && " · butuh Jenis Quest"}
            {!category.requiresRegion && !category.requiresQuestType && " · tanpa Region/Quest"}
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
      action={async (formData) => {
        await updateJokiCategory(formData);
        setEditing(false);
      }}
      className="bg-shihu-card border border-shihu-corona/40 rounded-2xl p-4 flex flex-col gap-3"
    >
      <input type="hidden" name="id" value={category.id} />
      <p className="font-display text-xs text-shihu-faint">
        {category.game.name}
      </p>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Nama kategori
        </label>
        <input
          name="name"
          defaultValue={category.name}
          required
          className="admin-input"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center justify-between gap-2 text-xs text-shihu-text font-display bg-[#241E38] rounded-xl px-3.5 py-3 border border-shihu-border">
          <span>
            Wajib pilih Region
            <span className="block text-[11px] text-shihu-faint font-normal mt-0.5">
              Aktifkan jika kategori ini (mis. Eksplorasi) selalu terikat ke
              region tertentu
            </span>
          </span>
          <input
            type="checkbox"
            name="requiresRegion"
            defaultChecked={category.requiresRegion}
            className="accent-shihu-corona w-4 h-4 shrink-0"
          />
        </label>

        <label className="flex items-center justify-between gap-2 text-xs text-shihu-text font-display bg-[#241E38] rounded-xl px-3.5 py-3 border border-shihu-border">
          <span>
            Wajib pilih Jenis Quest
            <span className="block text-[11px] text-shihu-faint font-normal mt-0.5">
              Aktifkan jika kategori ini (mis. Quest) selalu terikat ke jenis
              quest tertentu
            </span>
          </span>
          <input
            type="checkbox"
            name="requiresQuestType"
            defaultChecked={category.requiresQuestType}
            className="accent-shihu-corona w-4 h-4 shrink-0"
          />
        </label>

        <label className="flex items-center justify-between gap-2 text-xs text-shihu-text font-display bg-[#241E38] rounded-xl px-3.5 py-3 border border-shihu-border">
          <span>
            Kategori Rawat Akun
            <span className="block text-[11px] text-shihu-faint font-normal mt-0.5">
              Aktifkan untuk kategori rawat akun — memunculkan opsi include
              event & pilihan konten endgame di form Joki Item
            </span>
          </span>
          <input
            type="checkbox"
            name="isRawatAkun"
            defaultChecked={category.isRawatAkun}
            className="accent-shihu-corona w-4 h-4 shrink-0"
          />
        </label>

        <label className="flex items-center justify-between gap-2 text-xs text-shihu-text font-display bg-[#241E38] rounded-xl px-3.5 py-3 border border-shihu-border">
          <span>
            Kategori Material
            <span className="block text-[11px] text-shihu-faint font-normal mt-0.5">
              Aktifkan jika kategori ini menjual material dengan harga per
              jumlah (mis. Rp 10.000 / 100 material)
            </span>
          </span>
          <input
            type="checkbox"
            name="isMaterial"
            defaultChecked={category.isMaterial}
            className="accent-shihu-corona w-4 h-4 shrink-0"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-xs text-shihu-muted font-display">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={category.isActive}
          className="accent-shihu-corona"
        />
        Kategori aktif (bisa dipakai saat membuat Joki Item)
      </label>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="px-4 py-2 rounded-xl font-display font-semibold text-xs text-[#1A1206] bg-corona"
        >
          Simpan
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
            fd.set("id", category.id);
            deleteJokiCategory(fd);
          }}
          className="ml-auto px-4 py-2 rounded-xl font-display font-medium text-xs text-red-400 hover:bg-red-400/10"
        >
          Hapus
        </button>
      </div>
    </form>
  );
}
