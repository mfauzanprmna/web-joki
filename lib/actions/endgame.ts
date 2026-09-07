"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ResetCycle } from "@prisma/client";

export interface EndgameActionState {
  error?: string;
}

function parseDate(value: FormDataEntryValue | null): Date | null {
  if (!value) return null;
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? null : d;
}

export async function createEndgameContent(
  _prevState: EndgameActionState | undefined,
  formData: FormData
): Promise<EndgameActionState> {
  const gameId = String(formData.get("gameId"));
  const title = String(formData.get("title"));
  const description = String(formData.get("description"));
  const priceRupiah = Number(formData.get("priceRupiah"));
  const resetCycle = String(formData.get("resetCycle")) as ResetCycle;

  const data = buildCycleFields(resetCycle, formData);
  if ("error" in data) return { error: data.error };

  await prisma.endgameContent.create({
    data: { gameId, title, description, priceRupiah, resetCycle, ...data },
  });

  revalidatePath("/admin/endgame");
  revalidatePath("/joki");

  return {};
}

export async function updateEndgameContent(
  _prevState: EndgameActionState | undefined,
  formData: FormData
): Promise<EndgameActionState> {
  const id = String(formData.get("id"));
  const title = String(formData.get("title"));
  const description = String(formData.get("description"));
  const priceRupiah = Number(formData.get("priceRupiah"));
  const resetCycle = String(formData.get("resetCycle")) as ResetCycle;
  const isActive = formData.get("isActive") === "on";

  const data = buildCycleFields(resetCycle, formData);
  if ("error" in data) return { error: data.error };

  await prisma.endgameContent.update({
    where: { id },
    data: { title, description, priceRupiah, resetCycle, isActive, ...data },
  });

  revalidatePath("/admin/endgame");
  revalidatePath("/joki");

  return {};
}

export async function deleteEndgameContent(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.endgameContent.delete({ where: { id } });

  revalidatePath("/admin/endgame");
  revalidatePath("/joki");
}

function buildCycleFields(
  resetCycle: ResetCycle,
  formData: FormData
): { anchorStartDate: Date | null; daysAfterPatchStart: number | null } | { error: string } {
  if (resetCycle === "PATCH_1") {
    const raw = formData.get("daysAfterPatchStart");
    const daysAfterPatchStart = raw ? Number(raw) : 0;
    if (isNaN(daysAfterPatchStart) || daysAfterPatchStart < 0) {
      return { error: "Jumlah hari setelah patch mulai harus angka 0 atau lebih." };
    }
    return { anchorStartDate: null, daysAfterPatchStart };
  }

  const anchorStartDate = parseDate(formData.get("anchorStartDate"));
  if (!anchorStartDate) {
    return { error: "Tanggal mulai awal wajib diisi untuk siklus reset ini." };
  }
  return { anchorStartDate, daysAfterPatchStart: null };
}
