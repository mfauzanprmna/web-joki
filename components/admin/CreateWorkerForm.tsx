"use client";

import { useActionState, useEffect, useRef } from "react";
import { createWorker, type WorkerActionState } from "@/lib/actions/worker";

export function CreateWorkerForm() {
    const [state, formAction, pending] = useActionState<WorkerActionState | undefined, FormData>(
        createWorker,
        undefined
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                    <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
                        Nama <span className="text-red-400">*</span>
                    </label>
                    <input name="name" required className="admin-input" placeholder="mis. Dimas" />
                </div>
                <div>
                    <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
                        Username <span className="text-red-400">*</span>
                    </label>
                    <input name="username" required className="admin-input" placeholder="mis. dimas" />
                </div>
                <div>
                    <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
                        Password <span className="text-red-400">*</span>
                    </label>
                    <input name="password" type="password" required minLength={6} className="admin-input" placeholder="min. 6 karakter" />
                </div>
            </div>

            {state?.error && (
                <p className="text-[12px] text-red-400 bg-red-400/10 rounded-lg px-2.5 py-1.5">{state.error}</p>
            )}

            <button
                type="submit"
                disabled={pending}
                className="self-start px-5 py-2.5 rounded-xl font-display font-semibold text-sm text-[#1A1206] bg-corona mt-1 disabled:opacity-60"
            >
                {pending ? "Menyimpan..." : "Tambah akun worker"}
            </button>
        </form>
    );
}