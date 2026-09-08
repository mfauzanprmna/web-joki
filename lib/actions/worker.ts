"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { hashPassword } from "@/lib/password";

export interface WorkerActionState {
    error?: string;
}

export async function createWorker(
    _prevState: WorkerActionState | undefined,
    formData: FormData
): Promise<WorkerActionState> {
    const name = String(formData.get("name") || "").trim();
    const username = String(formData.get("username") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");

    if (!name) return { error: "Nama wajib diisi." };
    if (!username) return { error: "Username wajib diisi." };
    if (!/^[a-z0-9._-]+$/.test(username)) {
        return { error: "Username cuma boleh huruf kecil, angka, titik, underscore, dan strip." };
    }
    if (password.length < 6) return { error: "Password minimal 6 karakter." };

    const existing = await prisma.worker.findUnique({ where: { username } });
    if (existing) return { error: "Username sudah dipakai, pilih yang lain." };

    await prisma.worker.create({
        data: { name, username, passwordHash: hashPassword(password) },
    });

    revalidatePath("/admin/worker");
    return {};
}

export async function updateWorker(
    _prevState: WorkerActionState | undefined,
    formData: FormData
): Promise<WorkerActionState> {
    const id = String(formData.get("id") || "").trim();
    const name = String(formData.get("name") || "").trim();
    const isActive = formData.get("isActive") === "on";
    const newPassword = String(formData.get("newPassword") || "");

    if (!id) return { error: "Worker tidak ditemukan." };
    if (!name) return { error: "Nama wajib diisi." };
    if (newPassword && newPassword.length < 6) {
        return { error: "Password baru minimal 6 karakter." };
    }

    await prisma.worker.update({
        where: { id },
        data: {
            name,
            isActive,
            ...(newPassword ? { passwordHash: hashPassword(newPassword) } : {}),
        },
    });

    revalidatePath("/admin/worker");
    return {};
}

export async function deleteWorker(formData: FormData) {
    const id = String(formData.get("id") || "").trim();
    if (!id) return;

    await prisma.worker.delete({ where: { id } });

    revalidatePath("/admin/worker");
    revalidatePath("/admin/antrian");
}

/** Menugaskan/melepas akun Worker dari sebuah Order (dropdown di baris pesanan). */
export async function assignWorkerToOrder(formData: FormData) {
    const orderId = String(formData.get("orderId") || "").trim();
    const workerId = String(formData.get("workerId") || "").trim();
    if (!orderId) return;

    await prisma.order.update({
        where: { id: orderId },
        data: { workerId: workerId || null },
    });

    revalidatePath("/admin/antrian");
    revalidatePath("/worker");
}