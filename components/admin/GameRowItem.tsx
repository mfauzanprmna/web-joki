"use client";

import { useState } from "react";
import { updateGame, deleteGame } from "@/lib/actions/game";

interface GameRow {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  accentColor: string;
}

export function GameRowItem({ game }: { game: GameRow }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="bg-shihu-card border border-shihu-border rounded-2xl p-4 flex items-center gap-4 flex-wrap">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: game.accentColor }}
        />
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display text-sm font-semibold">{game.name}</p>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2C2540] text-shihu-faint font-display">
              {game.slug}
            </span>
          </div>
          <p className="text-shihu-muted text-xs mt-0.5">{game.tagline}</p>
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
        await updateGame(formData);
        setEditing(false);
      }}
      className="bg-shihu-card border border-shihu-corona/40 rounded-2xl p-4 flex flex-col gap-3"
    >
      <input type="hidden" name="id" value={game.id} />
      <p className="font-display text-xs text-shihu-faint">
        Slug: {game.slug} (tidak bisa diubah)
      </p>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Nama game
        </label>
        <input
          name="name"
          defaultValue={game.name}
          required
          className="admin-input"
        />
      </div>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Tagline
        </label>
        <input
          name="tagline"
          defaultValue={game.tagline}
          required
          className="admin-input"
        />
      </div>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Warna aksen (hex)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            defaultValue={game.accentColor}
            className="w-10 h-9 rounded-lg border border-shihu-border bg-transparent cursor-pointer"
            onChange={(e) => {
              const input = e.currentTarget
                .nextElementSibling as HTMLInputElement | null;
              if (input) input.value = e.currentTarget.value;
            }}
          />
          <input
            name="accentColor"
            defaultValue={game.accentColor}
            required
            className="admin-input flex-1"
            placeholder="#FFB238"
          />
        </div>
      </div>

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
            fd.set("id", game.id);
            deleteGame(fd);
          }}
          className="ml-auto px-4 py-2 rounded-xl font-display font-medium text-xs text-red-400 hover:bg-red-400/10"
        >
          Hapus
        </button>
      </div>
    </form>
  );
}
