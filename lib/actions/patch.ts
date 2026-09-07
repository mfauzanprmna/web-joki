"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface PatchActionState {
  error?: string;
}

function parseDate(value: FormDataEntryValue | null): Date | null {
  if (!value) return null;
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? null : d;
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
  revalidatePath("/joki");
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
  revalidatePath("/joki");
  revalidatePath("/");

  return {};
}

export async function deletePatch(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.patch.delete({ where: { id } });

  revalidatePath("/admin/patch");
  revalidatePath("/joki");
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

  await prisma.patchEvent.create({
    data: { patchId, title, description, priceRupiah, startDate, endDate },
  });

  revalidatePath("/admin/patch");
  revalidatePath("/joki");

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

  await prisma.patchEvent.update({
    where: { id },
    data: { title, description, priceRupiah, startDate, endDate },
  });

  revalidatePath("/admin/patch");
  revalidatePath("/joki");

  return {};
}

export async function deletePatchEvent(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.patchEvent.delete({ where: { id } });

  revalidatePath("/admin/patch");
  revalidatePath("/joki");
}
