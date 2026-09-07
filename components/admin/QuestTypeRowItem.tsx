"use client";

import { useState } from "react";
import { updateQuestType, deleteQuestType } from "@/lib/actions/joki";

interface GameOption {
  id: string;
  name: string;
  accentColor: string;
}

type QuestKind = "WORLD" | "ARCHON" | "LAINNYA";

const QUEST_KIND_LABEL: Record<QuestKind, string> = {
  WORLD: "World Quest",
  ARCHON: "Archon Quest",
  LAINNYA: "Lainnya",
};

interface QuestTypeRow {
  id: string;
  name: string;
  isRegionSpecific: boolean;
  questKind: QuestKind;
  isActive: boolean;
  game: GameOption;
}

export function QuestTypeRowItem({ questType }: { questType: QuestTypeRow }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="bg-shihu-card border border-shihu-border rounded-2xl p-4 flex items-center gap-4 flex-wrap">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: questType.game.accentColor }}
        />
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display text-sm font-semibold">{questType.name}</p>
            {questType.questKind !== "LAINNYA" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-shihu-corona/15 text-shihu-corona font-display">
                {QUEST_KIND_LABEL[questType.questKind]}
              </span>
            )}
            {questType.isRegionSpecific && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-shihu-violet/15 text-shihu-violet font-display">
                Spesifik region
              </span>
            )}
            {!questType.isActive && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-400/15 text-red-400 font-display">
                Nonaktif
              </span>
            )}
          </div>
          <p className="text-shihu-muted text-xs mt-0.5">{questType.game.name}</p>
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
        await updateQuestType(formData);
        setEditing(false);
      }}
      className="bg-shihu-card border border-shihu-corona/40 rounded-2xl p-4 flex flex-col gap-3"
    >
      <input type="hidden" name="id" value={questType.id} />
      <p className="font-display text-xs text-shihu-faint">
        {questType.game.name}
      </p>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Nama jenis quest
        </label>
        <input
          name="name"
          defaultValue={questType.name}
          required
          className="admin-input"
        />
      </div>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Jenis
        </label>
        <select
          name="questKind"
          defaultValue={questType.questKind}
          className="admin-input"
        >
          <option value="LAINNYA">Lainnya</option>
          <option value="WORLD">World Quest</option>
          <option value="ARCHON">Archon Quest</option>
        </select>
        <p className="text-[11px] text-shihu-faint mt-1">
          Dipakai untuk menyaring pilihan World Quest / Archon Quest saat
          menyusun Paket Joki.
        </p>
      </div>

      <label className="flex items-center justify-between gap-2 text-xs text-shihu-text font-display bg-[#241E38] rounded-xl px-3.5 py-3 border border-shihu-border">
        <span>
          Spesifik ke region tertentu
          <span className="block text-[11px] text-shihu-faint font-normal mt-0.5">
            Jika aktif, Joki Item dengan jenis quest ini wajib juga memilih
            Region
          </span>
        </span>
        <input
          type="checkbox"
          name="isRegionSpecific"
          defaultChecked={questType.isRegionSpecific}
          className="accent-shihu-corona w-4 h-4 shrink-0"
        />
      </label>

      <label className="flex items-center gap-2 text-xs text-shihu-muted font-display">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={questType.isActive}
          className="accent-shihu-corona"
        />
        Jenis quest aktif (bisa dipilih saat membuat Joki Item)
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
            fd.set("id", questType.id);
            deleteQuestType(fd);
          }}
          className="ml-auto px-4 py-2 rounded-xl font-display font-medium text-xs text-red-400 hover:bg-red-400/10"
        >
          Hapus
        </button>
      </div>
    </form>
  );
}
