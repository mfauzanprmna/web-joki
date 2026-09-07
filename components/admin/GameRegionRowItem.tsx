"use client";

import { useState } from "react";
import { updateGameRegion, deleteGameRegion } from "@/lib/actions/joki";

interface GameOption {
  id: string;
  name: string;
  accentColor: string;
}

interface RegionRow {
  id: string;
  name: string;
  isActive: boolean;
  game: GameOption;
}

export function GameRegionRowItem({ region }: { region: RegionRow }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="bg-shihu-card border border-shihu-border rounded-2xl p-4 flex items-center gap-4 flex-wrap">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: region.game.accentColor }}
        />
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display text-sm font-semibold">{region.name}</p>
            {!region.isActive && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-400/15 text-red-400 font-display">
                Nonaktif
              </span>
            )}
          </div>
          <p className="text-shihu-muted text-xs mt-0.5">{region.game.name}</p>
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
        await updateGameRegion(formData);
        setEditing(false);
      }}
      className="bg-shihu-card border border-shihu-corona/40 rounded-2xl p-4 flex flex-col gap-3"
    >
      <input type="hidden" name="id" value={region.id} />
      <p className="font-display text-xs text-shihu-faint">
        {region.game.name}
      </p>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Nama region
        </label>
        <input
          name="name"
          defaultValue={region.name}
          required
          className="admin-input"
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-shihu-muted font-display">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={region.isActive}
          className="accent-shihu-corona"
        />
        Region aktif (bisa dipilih saat membuat Joki Item)
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
            fd.set("id", region.id);
            deleteGameRegion(fd);
          }}
          className="ml-auto px-4 py-2 rounded-xl font-display font-medium text-xs text-red-400 hover:bg-red-400/10"
        >
          Hapus
        </button>
      </div>
    </form>
  );
}
