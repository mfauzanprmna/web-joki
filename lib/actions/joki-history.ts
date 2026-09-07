"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface JokiHistoryActionState {
  error?: string;
}

function parseDate(value: FormDataEntryValue | null): Date | null {
  if (!value) return null;
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? null : d;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** Tambah 1 entri history joki secara manual (form ringkas di /admin/history-joki). */
export async function createJokiHistoryEntry(
  _prevState: JokiHistoryActionState | undefined,
  formData: FormData
): Promise<JokiHistoryActionState> {
  const gameId = String(formData.get("gameId") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const customerName = String(formData.get("customerName") || "").trim();
  const jokerName = String(formData.get("jokerName") || "").trim();
  const completedAt = parseDate(formData.get("completedAt")) ?? new Date();
  const ratingRaw = String(formData.get("rating") || "").trim();
  const rating = ratingRaw ? Number(ratingRaw) : null;
  const note = String(formData.get("note") || "").trim();
  const screenshotUrlsRaw = String(formData.get("screenshotUrls") || "").trim();

  if (!gameId) return { error: "Pilih game terlebih dahulu." };
  if (!title) return { error: "Judul joki wajib diisi." };
  if (!customerName) return { error: "Nama customer wajib diisi." };
  if (rating != null && (Number.isNaN(rating) || rating < 1 || rating > 5)) {
    return { error: "Rating harus angka 1-5." };
  }

  const screenshotUrls = screenshotUrlsRaw
    ? screenshotUrlsRaw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  for (const url of screenshotUrls) {
    if (!isValidHttpUrl(url)) {
      return { error: `Link screenshot tidak valid: ${url}` };
    }
  }

  await prisma.jokiHistoryEntry.create({
    data: {
      gameId,
      title,
      customerName,
      jokerName: jokerName || null,
      completedAt,
      rating,
      note: note || null,
      screenshotUrls,
    },
  });

  revalidatePath("/admin/history-joki");
  revalidatePath("/history");
  return {};
}

export async function deleteJokiHistoryEntry(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  if (!id) return;

  await prisma.jokiHistoryEntry.delete({ where: { id } });

  revalidatePath("/admin/history-joki");
  revalidatePath("/history");
}
