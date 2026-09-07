"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updatePatch, deletePatch, createPatchEvent, type PatchActionState } from "@/lib/actions/patch";
import { isPatchOngoing } from "@/lib/patch-schedule";
import { toDateTimeLocalValue } from "@/lib/date-input";
import { PatchEventRowItem } from "./PatchEventRowItem";

interface PatchEventData {
  id: string;
  title: string;
  description: string;
  priceRupiah: number;
  startDate: Date;
  endDate: Date;
}

interface PatchRow {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  game: { name: string; accentColor: string };
  events: PatchEventData[];
}

export function PatchRowItem({ patch }: { patch: PatchRow }) {
  const [editing, setEditing] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [state, formAction, pending] = useActionState<PatchActionState | undefined, FormData>(
    updatePatch,
    undefined
  );
  const hasSubmittedRef = useRef(false);
  const ongoing = isPatchOngoing(patch);
  const upcoming = patch.startDate > new Date();

  useEffect(() => {
    if (hasSubmittedRef.current && !pending && !state?.error) {
      setEditing(false);
      hasSubmittedRef.current = false;
    }
  }, [pending, state]);

  return (
    <div className="bg-shihu-card border border-shihu-border rounded-2xl p-4 flex flex-col gap-3.5">
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: patch.game.accentColor }}
        />
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display text-sm font-semibold">{patch.name}</p>
            {ongoing && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-shihu-corona/15 text-shihu-corona font-display">
                Sedang berjalan
              </span>
            )}
            {upcoming && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-shihu-violet/15 text-shihu-violet font-display">
                Belum mulai
              </span>
            )}
          </div>
          <p className="text-shihu-muted text-xs mt-0.5">
            {patch.game.name} · {patch.startDate.toLocaleDateString("id-ID")} –{" "}
            {patch.endDate.toLocaleDateString("id-ID")}
          </p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-display font-medium border border-shihu-borderSoft text-shihu-text hover:bg-[#2C2540]"
          >
            Edit
          </button>
        )}
      </div>

      {editing && (
        <form
          action={(formData) => {
            hasSubmittedRef.current = true;
            formAction(formData);
          }}
          className="flex flex-col gap-2.5 bg-[#241E38] border border-shihu-corona/40 rounded-xl p-3.5"
        >
          <input type="hidden" name="id" value={patch.id} />
          <input
            name="name"
            defaultValue={patch.name}
            required
            className="admin-input"
            placeholder="Patch 5.0"
          />

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-display font-medium text-shihu-muted mb-1">
                Mulai
              </label>
              <input
                type="datetime-local"
                name="startDate"
                defaultValue={toDateTimeLocalValue(patch.startDate)}
                required
                className="admin-input"
              />
            </div>
            <div>
              <label className="block text-[11px] font-display font-medium text-shihu-muted mb-1">
                Selesai
              </label>
              <input
                type="datetime-local"
                name="endDate"
                defaultValue={toDateTimeLocalValue(patch.endDate)}
                required
                className="admin-input"
              />
            </div>
          </div>

          {state?.error && (
            <p className="text-[12px] text-red-400 bg-red-400/10 rounded-lg px-2.5 py-1.5">
              {state.error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="px-3 py-1.5 rounded-lg font-display font-semibold text-[11px] text-[#1A1206] bg-corona disabled:opacity-60"
            >
              {pending ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 rounded-lg font-display font-medium text-[11px] border border-shihu-borderSoft"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                const fd = new FormData();
                fd.set("id", patch.id);
                deletePatch(fd);
              }}
              className="ml-auto px-4 py-2 rounded-xl font-display font-medium text-xs text-red-400 hover:bg-red-400/10"
            >
              Hapus patch
            </button>
          </div>
        </form>
      )}

      <div className="pl-4 border-l-2 border-shihu-border flex flex-col gap-2">
        <p className="font-display text-[11.5px] font-semibold text-shihu-muted">
          Event dalam patch ini ({patch.events.length})
        </p>

        {patch.events.map((ev) => (
          <PatchEventRowItem key={ev.id} event={ev} />
        ))}

        {showEventForm ? (
          <CreateEventInlineForm
            patchId={patch.id}
            onDone={() => setShowEventForm(false)}
          />
        ) : (
          <button
            onClick={() => setShowEventForm(true)}
            className="self-start px-3 py-1.5 rounded-lg font-display font-medium text-[11px] border border-dashed border-shihu-borderSoft text-shihu-muted hover:text-shihu-text hover:border-shihu-corona/50"
          >
            + Tambah event
          </button>
        )}
      </div>
    </div>
  );
}

function CreateEventInlineForm({ patchId, onDone }: { patchId: string; onDone: () => void }) {
  const [state, formAction, pending] = useActionState<PatchActionState | undefined, FormData>(
    createPatchEvent,
    undefined
  );
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    if (hasSubmittedRef.current && !pending && !state?.error) {
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, state]);

  return (
    <form
      action={(formData) => {
        hasSubmittedRef.current = true;
        formAction(formData);
      }}
      className="bg-[#241E38] border border-shihu-corona/40 rounded-xl p-3.5 flex flex-col gap-2.5"
    >
      <input type="hidden" name="patchId" value={patchId} />

      <input name="title" required className="admin-input" placeholder="Judul event" />
      <textarea name="description" required rows={2} className="admin-input" placeholder="Deskripsi event" />
      <input type="number" name="priceRupiah" required min={0} className="admin-input" placeholder="Harga (Rp)" />

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[11px] font-display font-medium text-shihu-muted mb-1">
            Mulai
          </label>
          <input type="datetime-local" name="startDate" required className="admin-input" />
        </div>
        <div>
          <label className="block text-[11px] font-display font-medium text-shihu-muted mb-1">
            Selesai
          </label>
          <input type="datetime-local" name="endDate" required className="admin-input" />
        </div>
      </div>

      {state?.error && (
        <p className="text-[12px] text-red-400 bg-red-400/10 rounded-lg px-2.5 py-1.5">{state.error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="px-3 py-1.5 rounded-lg font-display font-semibold text-[11px] text-[#1A1206] bg-corona disabled:opacity-60"
        >
          {pending ? "Menyimpan..." : "Tambah event"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-3 py-1.5 rounded-lg font-display font-medium text-[11px] border border-shihu-borderSoft"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
