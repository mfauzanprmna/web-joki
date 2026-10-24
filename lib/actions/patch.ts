"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { syncRawatAkunLinesForEventChange } from "@/lib/rawat-akun-service";

export interface PatchActionState {
  error?: string;
}

function parseDate(value: FormDataEntryValue | null): Date | null {
  if (!value) return null;
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Masukkan event yang baru dibuat / berubah tanggalnya ke checklist order
 * Rawat Akun yang SUDAH berjalan (lihat syncRawatAkunLinesForEventChange).
 * Event-nya sendiri sudah tersimpan saat ini dipanggil, jadi kegagalan di
 * sini tidak boleh membuat action terlihat gagal -- cukup dicatat; baris
 * yang gagal disinkronkan otomatis dicoba lagi saat halamannya dibuka.
 */
async function applyEventToExistingOrders(gameId: string, from: Date, to: Date) {
  try {
    const count = await syncRawatAkunLinesForEventChange({ gameId, from, to });
    if (count > 0) {
      revalidatePath("/progress/[slug]", "page");
    }
  } catch (err) {
    console.error("Gagal memasukkan event ke order Rawat Akun yang sudah ada:", err);
  }
}

// ---------- Patch ----------

export async function createPatch(
  _prevState: PatchActionState | undefined,
  formData: FormData
): Promise<PatchActionState> {
  const gameId = String(formData.get("gameId"));
  const name = String(formData.get("name"));
  const startDate = parseDate(formData.get("startDate"));
  const endDate = parseDate(formData.get("endDate"));

  if (!startDate || !endDate) {
    return { error: "Tanggal mulai dan selesai wajib diisi dengan format valid." };
  }
  if (endDate <= startDate) {
    return { error: "Tanggal selesai harus setelah tanggal mulai." };
  }

  await prisma.patch.create({
    data: { gameId, name, startDate, endDate },
  });

  revalidatePath("/admin/patch");
  revalidatePath("/[slug]", "page");
  revalidatePath("/");

  return {};
}

export async function updatePatch(
  _prevState: PatchActionState | undefined,
  formData: FormData
): Promise<PatchActionState> {
  const id = String(formData.get("id"));
  const name = String(formData.get("name"));
  const startDate = parseDate(formData.get("startDate"));
  const endDate = parseDate(formData.get("endDate"));

  if (!startDate || !endDate) {
    return { error: "Tanggal mulai dan selesai wajib diisi dengan format valid." };
  }
  if (endDate <= startDate) {
    return { error: "Tanggal selesai harus setelah tanggal mulai." };
  }

  await prisma.patch.update({
    where: { id },
    data: { name, startDate, endDate },
  });

  revalidatePath("/admin/patch");
  revalidatePath("/[slug]", "page");
  revalidatePath("/");

  return {};
}

export async function deletePatch(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.patch.delete({ where: { id } });

  revalidatePath("/admin/patch");
  revalidatePath("/[slug]", "page");
  revalidatePath("/");
}

// ---------- PatchEvent ----------

export async function createPatchEvent(
  _prevState: PatchActionState | undefined,
  formData: FormData
): Promise<PatchActionState> {
  const patchId = String(formData.get("patchId"));
  const title = String(formData.get("title"));
  const description = String(formData.get("description"));
  const priceRupiah = Number(formData.get("priceRupiah"));
  const startDate = parseDate(formData.get("startDate"));
  const endDate = parseDate(formData.get("endDate"));

  if (!startDate || !endDate) {
    return { error: "Tanggal mulai dan selesai event wajib diisi dengan format valid." };
  }
  if (endDate <= startDate) {
    return { error: "Tanggal selesai event harus setelah tanggal mulai." };
  }

  const created = await prisma.patchEvent.create({
    data: { patchId, title, description, priceRupiah, startDate, endDate },
    select: { patch: { select: { gameId: true } } },
  });

  await applyEventToExistingOrders(created.patch.gameId, startDate, endDate);

  revalidatePath("/admin/patch");
  revalidatePath("/[slug]", "page");

  return {};
}

export async function updatePatchEvent(
  _prevState: PatchActionState | undefined,
  formData: FormData
): Promise<PatchActionState> {
  const id = String(formData.get("id"));
  const title = String(formData.get("title"));
  const description = String(formData.get("description"));
  const priceRupiah = Number(formData.get("priceRupiah"));
  const startDate = parseDate(formData.get("startDate"));
  const endDate = parseDate(formData.get("endDate"));

  if (!startDate || !endDate) {
    return { error: "Tanggal mulai dan selesai event wajib diisi dengan format valid." };
  }
  if (endDate <= startDate) {
    return { error: "Tanggal selesai event harus setelah tanggal mulai." };
  }

  const before = await prisma.patchEvent.findUnique({
    where: { id },
    select: { startDate: true, endDate: true },
  });

  const updated = await prisma.patchEvent.update({
    where: { id },
    data: { title, description, priceRupiah, startDate, endDate },
    select: { patch: { select: { gameId: true } } },
  });

  // Selalu sinkronkan ulang order yang kena, walau tanggal tidak berubah:
  // sinkron ulang itu idempotent (cuma menambah task yang belum ada), jadi
  // murah kalau tidak ada yang perlu ditambah -- dan sekaligus jadi cara
  // "menyusulkan" event yang dulu dibuat sebelum fitur ini ada ke order
  // lama (cukup simpan ulang event-nya). Rentang yang dicek gabungan tanggal
  // lama + baru, supaya perpanjangan ke arah manapun tercakup. Perhatikan:
  // judul yang diubah TIDAK menimpa label task yang sudah terlanjur dibuat.
  const from = before && before.startDate < startDate ? before.startDate : startDate;
  const to = before && before.endDate > endDate ? before.endDate : endDate;
  await applyEventToExistingOrders(updated.patch.gameId, from, to);

  revalidatePath("/admin/patch");
  revalidatePath("/[slug]", "page");

  return {};
}

export async function deletePatchEvent(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.patchEvent.delete({ where: { id } });

  revalidatePath("/admin/patch");
  revalidatePath("/[slug]", "page");
}
