"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { updateContactLink, deleteContactLink, type SettingActionState } from "@/lib/actions/settings";
import { ContactIcon } from "@/components/ContactIcon";
import { ContactLinkFormFields } from "./ContactLinkFormFields";
import { FaPen, FaTrash, FaFloppyDisk, FaXmark } from "react-icons/fa6";

interface ContactLinkRow {
  id: string;
  icon: string;
  logoUrl: string | null;
  name: string;
  url: string;
  position: number;
}

export function ContactLinkRowItem({ item }: { item: ContactLinkRow }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<SettingActionState | undefined, FormData>(
    updateContactLink,
    undefined,
  );
  const wasPending = useRef(false);
  const [deletePending, startDeleteTransition] = useTransition();

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setEditing(false);
    }
    wasPending.current = pending;
  }, [pending, state]);

  if (!editing) {
    return (
      <div className="bg-shihu-card border border-shihu-border rounded-2xl p-4 flex items-center gap-3 flex-wrap">
        <span className="w-9 h-9 rounded-xl bg-shihu-corona/10 text-shihu-corona flex items-center justify-center shrink-0">
          <ContactIcon icon={item.icon} logoUrl={item.logoUrl} size={16} />
        </span>
        <div className="flex-1 min-w-[180px]">
          <p className="font-display text-sm font-semibold">{item.name}</p>
          <p className="text-shihu-muted text-xs mt-0.5 break-all">{item.url}</p>
        </div>
        <span className="text-[11px] text-shihu-faint font-display shrink-0">Urutan {item.position}</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-medium border border-shihu-borderSoft text-shihu-text hover:bg-[rgb(var(--admin-panel-soft))]"
        >
          <FaPen size={10} aria-hidden="true" />
          Edit
        </button>
        <button
          type="button"
          disabled={deletePending}
          aria-busy={deletePending}
          onClick={() => {
            const fd = new FormData();
            fd.set("id", item.id);
            startDeleteTransition(() => {
              deleteContactLink(fd);
            });
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-medium text-red-400 hover:bg-red-400/10 disabled:opacity-60"
        >
          <FaTrash size={10} aria-hidden="true" />
          {deletePending ? "Menghapus..." : "Hapus"}
        </button>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="bg-shihu-card border border-shihu-corona/40 rounded-2xl p-4 flex flex-col gap-3"
    >
      <input type="hidden" name="id" value={item.id} />

      <ContactLinkFormFields showPosition defaults={item} />

      {state?.error && (
        <p className="text-[12px] text-red-400 bg-red-400/10 rounded-lg px-2.5 py-1.5">{state.error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-corona text-[#1A1206] text-xs font-display font-semibold disabled:opacity-60"
        >
          <FaFloppyDisk size={11} aria-hidden="true" />
          {pending ? "Menyimpan..." : "Simpan"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setEditing(false)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-display font-medium text-shihu-muted hover:bg-[rgb(var(--admin-panel-soft))] disabled:opacity-60"
        >
          <FaXmark size={11} aria-hidden="true" />
          Batal
        </button>
      </div>
    </form>
  );
}
