"use client";

import { useActionState, useEffect, useRef } from "react";
import { createContactLink, type SettingActionState } from "@/lib/actions/settings";
import { ContactLinkFormFields } from "./ContactLinkFormFields";
import { FaPlus } from "react-icons/fa6";

export function CreateContactLinkForm() {
  const [state, formAction, pending] = useActionState<SettingActionState | undefined, FormData>(
    createContactLink,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      formRef.current?.reset();
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3 mt-4">
      <ContactLinkFormFields />

      {state?.error && (
        <p className="text-[12px] text-red-400 bg-red-400/10 rounded-lg px-2.5 py-1.5">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="self-start flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-semibold text-sm text-[#1A1206] bg-corona mt-1 disabled:opacity-60"
      >
        <FaPlus size={12} aria-hidden="true" />
        {pending ? "Menyimpan..." : "Tambah kontak"}
      </button>
    </form>
  );
}
