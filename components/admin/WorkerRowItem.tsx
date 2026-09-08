"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateWorker, deleteWorker, type WorkerActionState } from "@/lib/actions/worker";

interface WorkerRow {
    id: string;
    name: string;
    username: string;
    isActive: boolean;
    orderCount: number;
}

export function WorkerRowItem({ item }: { item: WorkerRow }) {
    const [editing, setEditing] = useState(false);
    const [state, formAction, pending] = useActionState<WorkerActionState | undefined, FormData>(
        updateWorker,
        undefined
    );
    const formRef = useRef<HTMLFormElement>(null);
    const wasPending = useRef(false);

    useEffect(() => {
        if (wasPending.current && !pending && !state?.error) {
            setEditing(false);
        }
        wasPending.current = pending;
    }, [pending, state]);

    if (!editing) {
        return (
            <div className="bg-shihu-card border border-shihu-border rounded-2xl p-4 flex items-center gap-3 flex-wrap">
                <span
                    className={`w-2 h-2 rounded-full shrink-0 ${item.isActive ? "bg-emerald-400" : "bg-shihu-faint"}`}
                />
                <div className="flex-1 min-w-[180px]">
                    <p className="font-display text-sm font-semibold">{item.name}</p>
                    <p className="text-shihu-muted text-xs mt-0.5">
                        @{item.username} · {item.orderCount} pesanan ditugaskan
                        {!item.isActive && " · Nonaktif"}
                    </p>
                </div>
                <button
                    onClick={() => setEditing(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-display font-medium border border-shihu-borderSoft text-shihu-text hover:bg-[#2C2540]"
                >
                    Edit
                </button>
                <button
                    type="button"
                    onClick={() => {
                        const fd = new FormData();
                        fd.set("id", item.id);
                        deleteWorker(fd);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-display font-medium text-red-400 hover:bg-red-400/10"
                >
                    Hapus
                </button>
            </div>
        );
    }

    return (
        <form
            ref={formRef}
            action={formAction}
            className="bg-shihu-card border border-shihu-corona/40 rounded-2xl p-4 flex flex-col gap-3"
        >
            <input type="hidden" name="id" value={item.id} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">Nama</label>
                    <input name="name" defaultValue={item.name} required className="admin-input" />
                </div>
                <div>
                    <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
                        Password baru (opsional)
                    </label>
                    <input name="newPassword" type="password" placeholder="Kosongkan jika tidak diganti" className="admin-input" />
                </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-shihu-text">
                <input type="checkbox" name="isActive" defaultChecked={item.isActive} className="accent-shihu-corona w-3.5 h-3.5" />
                Akun aktif (bisa login)
            </label>

            {state?.error && <p className="text-[12px] text-red-400">{state.error}</p>}

            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={pending}
                    className="px-4 py-2 rounded-lg bg-corona text-[#1A1206] text-xs font-display font-semibold disabled:opacity-60"
                >
                    {pending ? "Menyimpan..." : "Simpan"}
                </button>
                <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 rounded-lg text-xs font-display font-medium text-shihu-muted hover:bg-white/5"
                >
                    Batal
                </button>
            </div>
        </form>
    );
}