"use client";

import { useEffect, useState } from "react";
import { FaBell, FaBellSlash } from "react-icons/fa6";

type PushState = "checking" | "disabled" | "enabled" | "unsupported";

function decodeVapidKey(key: string): Uint8Array<ArrayBuffer> {
    const padding = "=".repeat((4 - (key.length % 4)) % 4);
    const base64 = (key + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = window.atob(base64);
    const bytes = new Uint8Array(new ArrayBuffer(raw.length));
    for (let index = 0; index < raw.length; index++) bytes[index] = raw.charCodeAt(index);
    return bytes;
}

export function AdminPushNotifications() {
    const [state, setState] = useState<PushState>("checking");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState("");
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    useEffect(() => {
        if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window) || !vapidPublicKey) {
            setState("unsupported");
            return;
        }

        navigator.serviceWorker.register("/sw.js")
            .then((registration) => registration.pushManager.getSubscription())
            .then((subscription) => setState(subscription ? "enabled" : "disabled"))
            .catch((cause: unknown) => {
                console.error("Gagal memeriksa notifikasi perangkat:", cause);
                setError("Tidak bisa menyiapkan notifikasi perangkat.");
                setState("disabled");
            });
    }, [vapidPublicKey]);

    async function toggleNotifications() {
        setPending(true);
        setError("");

        try {
            const registration = await navigator.serviceWorker.ready;
            const existing = await registration.pushManager.getSubscription();

            if (existing) {
                const response = await fetch("/api/push/subscription", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ endpoint: existing.endpoint }),
                });
                if (!response.ok) throw new Error("Gagal menonaktifkan notifikasi pada server.");
                await existing.unsubscribe();
                setState("disabled");
                return;
            }

            const permission = Notification.permission === "default"
                ? await Notification.requestPermission()
                : Notification.permission;
            if (permission !== "granted") {
                throw new Error("Izin notifikasi tidak diberikan. Ubah izin situs di pengaturan browser untuk mencoba lagi.");
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: decodeVapidKey(vapidPublicKey!),
            });
            const response = await fetch("/api/push/subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(subscription),
            });
            if (!response.ok) {
                await subscription.unsubscribe();
                throw new Error("Gagal menyimpan perangkat. Coba lagi.");
            }
            setState("enabled");
        } catch (cause) {
            console.error("Gagal mengubah pengaturan notifikasi perangkat:", cause);
            setError(cause instanceof Error ? cause.message : "Notifikasi perangkat gagal diatur.");
        } finally {
            setPending(false);
        }
    }

    if (state === "checking") {
        return <span className="text-[11px] text-shihu-faint">Memeriksa notifikasi perangkat…</span>;
    }

    if (state === "unsupported") {
        return (
            <p className="max-w-xs text-right text-[11px] text-shihu-muted">
                Push belum tersedia. Perlu browser yang mendukung dan konfigurasi server.
            </p>
        );
    }

    return (
        <div className="flex flex-col items-end gap-1">
            <button
                type="button"
                onClick={toggleNotifications}
                disabled={pending}
                aria-busy={pending}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-display font-semibold disabled:opacity-60 ${
                    state === "enabled"
                        ? "border-shihu-corona/40 bg-shihu-corona/15 text-shihu-corona"
                        : "border-shihu-border text-shihu-muted hover:bg-[rgb(var(--admin-panel-soft))]"
                }`}
            >
                {state === "enabled" ? <FaBellSlash aria-hidden="true" /> : <FaBell aria-hidden="true" />}
                {pending ? "Menyimpan…" : state === "enabled" ? "Matikan push di perangkat ini" : "Aktifkan push di perangkat ini"}
            </button>
            {error && <p role="alert" className="max-w-sm text-right text-[11px] text-red-400">{error}</p>}
        </div>
    );
}
