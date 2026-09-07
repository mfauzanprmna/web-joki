"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updatePatchEvent, deletePatchEvent, type PatchActionState } from "@/lib/actions/patch";
import { formatRupiah } from "@/lib/format";
import { isPatchEventLive } from "@/lib/patch-schedule";
import { toDateTimeLocalValue } from "@/lib/date-input";

interface PatchEventRow {
  id: string;
  title: string;
  description: string;
  priceRupiah: number;
  startDate: Date;
  endDate: Date;
}

export function PatchEventRowItem({ event }: { event: PatchEventRow }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<PatchActionState | undefined, FormData>(
    updatePatchEvent,
    undefined
  );
  const hasSubmittedRef = useRef(false);
  const live = isPatchEventLive(event);

  useEffect(() => {
    if (hasSubmittedRef.current && !pending && !state?.error) {
      setEditing(false);
      hasSubmittedRef.current = false;
    }
  }, [pending, state]);

  if (!editing) {
    return (
      <div className="bg-[#241E38] border border-shihu-border rounded-xl p-3.5 flex items-center gap-3 flex-wrap">
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-display shrink-0 ${
            live ? "bg-shihu-corona/15 text-shihu-corona" : "bg-shihu-faint/15 text-shihu-faint"
          }`}
        >
          {live ? "Tampil di customer" : "Tidak tampil"}
        </span>
        <div className="flex-1 min-w-[180px]">
          <p className="font-display text-[13px] font-semibold">{event.title}</p>
          <p className="text-shihu-muted text-[11.5px] mt-0.5">
            {formatRupiah(event.priceRupiah)} · {event.startDate.toLocaleDateString("id-ID")} –{" "}
            {event.endDate.toLocaleDateString("id-ID")}
          </p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="px-2.5 py-1 rounded-lg text-[11px] font-display font-medium border border-shihu-borderSoft hover:bg-[#2C2540]"
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
      className="bg-[#241E38] border border-shihu-corona/40 rounded-xl p-3.5 flex flex-col gap-2.5"
    >
      <input type="hidden" name="id" value={event.id} />

      <input
        name="title"
        defaultValue={event.title}
        required
        className="admin-input"
        placeholder="Judul event"
      />
      <textarea
        name="description"
        defaultValue={event.description}
        required
        rows={2}
        className="admin-input"
        placeholder="Deskripsi event"
      />

      <div className="grid grid-cols-2 gap-2.5">
        <input
          type="number"
          name="priceRupiah"
          defaultValue={event.priceRupiah}
          required
          min={0}
          className="admin-input"
          placeholder="Harga"
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[11px] font-display font-medium text-shihu-muted mb-1">
            Mulai
          </label>
          <input
            type="datetime-local"
            name="startDate"
            defaultValue={toDateTimeLocalValue(event.startDate)}
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
            defaultValue={toDateTimeLocalValue(event.endDate)}
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
            fd.set("id", event.id);
            deletePatchEvent(fd);
          }}
          className="ml-auto px-4 py-2 rounded-xl font-display font-medium text-xs text-red-400 hover:bg-red-400/10"
        >
          Hapus
        </button>
      </div>
    </form>
  );
}
