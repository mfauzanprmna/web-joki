"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, isSessionSecretConfigured, verifySessionToken } from "@/lib/session-token";

const WORKER_COOKIE = "shihu_worker_session";

export async function workerLoginAction(
    _prevState: { error?: string } | undefined,
    formData: FormData
): Promise<{ error?: string }> {
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "");

    if (!username || !password) {
        return { error: "Username dan password wajib diisi." };
    }
    if (username.length > 100 || password.length > 1024) {
        return { error: "Username atau password tidak valid." };
    }
    if (!isSessionSecretConfigured()) {
        return { error: "SESSION_SECRET wajib diisi minimal 32 byte di environment server." };
    }

    const worker = await prisma.worker.findUnique({
        where: { username },
        select: { id: true, isActive: true, passwordHash: true },
    });

    if (!worker || !worker.isActive || !verifyPassword(password, worker.passwordHash)) {
        return { error: "Username atau password salah." };
    }

    const cookieStore = await cookies();
    cookieStore.set(WORKER_COOKIE, await createSessionToken(worker.id, 60 * 60 * 24 * 7), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 hari
    });

    redirect("/worker");
}

export async function workerLogoutAction() {
    const cookieStore = await cookies();
    cookieStore.delete(WORKER_COOKIE);
    redirect("/worker/login");
}

/** Ambil worker yang sedang login dari cookie session, atau null kalau belum login/nonaktif. */
export async function getCurrentWorker() {
    const cookieStore = await cookies();
    const workerId = await verifySessionToken(cookieStore.get(WORKER_COOKIE)?.value);
    if (!workerId) return null;

    const worker = await prisma.worker.findUnique({
        where: { id: workerId },
        select: { id: true, name: true, isActive: true },
    });
    if (!worker || !worker.isActive) return null;

    return worker;
}