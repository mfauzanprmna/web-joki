"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notifyPriceListChanged } from "@/lib/discord-notify";

export interface PaketActionState {
  error?: string;
}

export async function createJokiPaket(
  _prevState: PaketActionState | undefined,
  formData: FormData
): Promise<PaketActionState> {
  const gameId = String(formData.get("gameId"));
  const title = String(formData.get("title"));
  const description = String(formData.get("description"));
  const priceRupiah = Number(formData.get("priceRupiah"));
  const regionId = String(formData.get("regionId") || "").trim() || null;
  const isAllMapRegion = regionId ? formData.get("isAllMapRegion") === "on" : false;

  if (isNaN(priceRupiah) || priceRupiah < 0) {
    return { error: "Harga paket harus berupa angka 0 atau lebih." };
  }

  // itemIds: base items + eksplorasi + world quest yang dipilih (baik manual
  // saat isAllMapRegion=false, maupun otomatis "semua" yang dikirim via
  // hidden input dari form saat isAllMapRegion=true — lihat JokiPaketFormFields).
  const itemIds = formData.getAll("itemIds").map(String).filter(Boolean);

  // Archon Quest selalu dipilih manual dari checklist terpisah, apapun kondisi isAllMapRegion.
  const archonQuestItemIds = regionId
    ? formData.getAll("archonQuestItemIds").map(String).filter(Boolean)
    : [];

  const allItemIds = Array.from(new Set([...itemIds, ...archonQuestItemIds]));

  await prisma.jokiPaket.create({
    data: {
      gameId,
      title,
      description,
      priceRupiah,
      regionId,
      isAllMapRegion,
      items: {
        create: allItemIds.map((jokiItemId) => ({ jokiItemId })),
      },
    },
  });

  revalidatePath("/admin/paket");
  revalidatePath("/joki");
  revalidatePath("/");

  const game = await prisma.game.findUnique({ where: { id: gameId }, select: { slug: true } });
  if (game) notifyPriceListChanged(game.slug);

  return {};
}

export async function updateJokiPaket(
  _prevState: PaketActionState | undefined,
  formData: FormData
): Promise<PaketActionState> {
  const id = String(formData.get("id"));
  const title = String(formData.get("title"));
  const description = String(formData.get("description"));
  const priceRupiah = Number(formData.get("priceRupiah"));
  const regionId = String(formData.get("regionId") || "").trim() || null;
  const isAllMapRegion = regionId ? formData.get("isAllMapRegion") === "on" : false;
  const isActive = formData.get("isActive") === "on";

  if (isNaN(priceRupiah) || priceRupiah < 0) {
    return { error: "Harga paket harus berupa angka 0 atau lebih." };
  }

  const itemIds = formData.getAll("itemIds").map(String).filter(Boolean);
  const archonQuestItemIds = regionId
    ? formData.getAll("archonQuestItemIds").map(String).filter(Boolean)
    : [];
  const allItemIds = Array.from(new Set([...itemIds, ...archonQuestItemIds]));

  const updated = await prisma.jokiPaket.update({
    where: { id },
    data: {
      title,
      description,
      priceRupiah,
      regionId,
      isAllMapRegion,
      isActive,
      items: {
        deleteMany: {},
        create: allItemIds.map((jokiItemId) => ({ jokiItemId })),
      },
    },
    select: { game: { select: { slug: true } } },
  });

  revalidatePath("/admin/paket");
  revalidatePath("/joki");
  revalidatePath("/");

  notifyPriceListChanged(updated.game.slug);

  return {};
}

export async function deleteJokiPaket(formData: FormData) {
  const id = String(formData.get("id"));
  const deleted = await prisma.jokiPaket.delete({
    where: { id },
    select: { game: { select: { slug: true } } },
  });

  revalidatePath("/admin/paket");
  revalidatePath("/joki");
  revalidatePath("/");

  notifyPriceListChanged(deleted.game.slug);
}