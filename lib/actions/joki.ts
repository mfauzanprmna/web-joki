"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { validateJokiItemRelations } from "@/lib/joki-rules";
import { notifyPriceListChanged } from "@/lib/discord-notify";

export interface JokiItemActionState {
  error?: string;
}

async function resolveRelationInputs(formData: FormData) {
  const categoryId = String(formData.get("categoryId"));
  const regionId = String(formData.get("regionId") || "").trim() || null;
  const questTypeId = String(formData.get("questTypeId") || "").trim() || null;

  const category = await prisma.jokiCategory.findUnique({ where: { id: categoryId } });
  if (!category) {
    return { error: "Kategori tidak ditemukan." };
  }

  let questType: { isRegionSpecific: boolean } | null = null;
  if (questTypeId) {
    questType = await prisma.questType.findUnique({ where: { id: questTypeId } });
    if (!questType) {
      return { error: "Jenis quest tidak ditemukan." };
    }
  }

  const validation = validateJokiItemRelations({
    categoryRequiresRegion: category.requiresRegion,
    categoryRequiresQuestType: category.requiresQuestType,
    questTypeIsRegionSpecific: questType?.isRegionSpecific ?? null,
    regionId,
    questTypeId,
  });

  if (!validation.valid) {
    return { error: validation.errors.join(" ") };
  }

  // Bersihkan relasi yang tidak relevan untuk kategori ini supaya data tidak menyimpan
  // region/quest "nyasar" dari kategori lain.
  const finalRegionId = category.requiresRegion || (category.requiresQuestType && questType?.isRegionSpecific)
    ? regionId
    : null;
  const finalQuestTypeId = category.requiresQuestType ? questTypeId : null;

  return {
    categoryId,
    isRawatAkun: category.isRawatAkun,
    isMaterial: category.isMaterial,
    requiresQuestType: category.requiresQuestType,
    regionId: finalRegionId,
    questTypeId: finalQuestTypeId,
  };
}

interface AdditionalFields {
  actNumber: number | null;
  unitQuantity: number | null;
}

/**
 * actNumber hanya relevan untuk kategori dengan requiresQuestType (Quest),
 * unitQuantity hanya relevan untuk kategori isMaterial. Field yang tidak
 * relevan dikosongkan supaya tidak menyimpan data "nyasar".
 */
function resolveAdditionalFields(
  formData: FormData,
  categoryRequiresQuestType: boolean,
  categoryIsMaterial: boolean
): AdditionalFields {
  const actNumber = categoryRequiresQuestType
    ? Number(formData.get("actNumber") || 1) || 1
    : null;
  const unitQuantity = categoryIsMaterial
    ? Number(formData.get("unitQuantity") || 0) || null
    : null;

  return { actNumber, unitQuantity };
}

interface RawatAkunFields {
  includeEvent: boolean;
  isPatchWide: boolean;
  patchId: string | null;
  endgameContentIds: string[];
  durationDays: number | null;
}

/**
 * Field Rawat Akun hanya relevan jika kategorinya isRawatAkun. Untuk kategori
 * lain, semua field ini dikosongkan supaya tidak menyimpan data "nyasar".
 * durationDays hanya relevan untuk Rawat Akun non-patch-wide (dipakai
 * menghitung tanggal selesai order otomatis, lihat lib/rawat-akun-schedule.ts).
 */
function resolveRawatAkunInputs(formData: FormData, categoryIsRawatAkun: boolean): RawatAkunFields {
  if (!categoryIsRawatAkun) {
    return { includeEvent: false, isPatchWide: false, patchId: null, endgameContentIds: [], durationDays: null };
  }

  const isPatchWide = formData.get("isPatchWide") === "on";
  const includeEvent = formData.get("includeEvent") === "on";
  const patchId = isPatchWide ? String(formData.get("patchId") || "").trim() || null : null;
  const endgameContentIds = isPatchWide ? [] : formData.getAll("endgameContentIds").map(String);
  const durationDays = isPatchWide ? null : Number(formData.get("durationDays") || 0) || null;

  return { includeEvent, isPatchWide, patchId, endgameContentIds, durationDays };
}

export async function createJokiItem(
  _prevState: JokiItemActionState | undefined,
  formData: FormData
): Promise<JokiItemActionState> {
  const gameId = String(formData.get("gameId"));
  const title = String(formData.get("title"));
  const description = String(formData.get("description"));
  const priceRupiah = Number(formData.get("priceRupiah"));
  const etaLabel = String(formData.get("etaLabel"));
  const badge = String(formData.get("badge") || "").trim();

  const resolved = await resolveRelationInputs(formData);
  if ("error" in resolved) {
    return { error: resolved.error };
  }

  const rawatAkun = resolveRawatAkunInputs(formData, resolved.isRawatAkun);
  if (rawatAkun.isPatchWide && !rawatAkun.patchId) {
    return { error: "Pilih Patch untuk Joki Item rawat akun bertipe 1 patch." };
  }
  if (resolved.isRawatAkun && !rawatAkun.isPatchWide && (!rawatAkun.durationDays || rawatAkun.durationDays <= 0)) {
    return { error: "Isi durasi per 1 unit (hari) untuk Joki Item rawat akun ini." };
  }

  const additional = resolveAdditionalFields(formData, resolved.requiresQuestType, resolved.isMaterial);

  await prisma.jokiItem.create({
    data: {
      gameId,
      categoryId: resolved.categoryId,
      regionId: resolved.regionId,
      questTypeId: resolved.questTypeId,
      title,
      description,
      priceRupiah,
      etaLabel,
      badge: badge || null,
      includeEvent: rawatAkun.includeEvent,
      isPatchWide: rawatAkun.isPatchWide,
      patchId: rawatAkun.patchId,
      durationDays: rawatAkun.durationDays,
      actNumber: additional.actNumber,
      unitQuantity: additional.unitQuantity,
      endgameContent: {
        create: rawatAkun.endgameContentIds.map((endgameContentId) => ({ endgameContentId })),
      },
    },
  });

  revalidatePath("/admin/joki");
  revalidatePath("/joki");
  revalidatePath("/");

  const game = await prisma.game.findUnique({ where: { id: gameId }, select: { slug: true } });
  if (game) notifyPriceListChanged(game.slug);

  return {};
}

export async function updateJokiItem(
  _prevState: JokiItemActionState | undefined,
  formData: FormData
): Promise<JokiItemActionState> {
  const id = String(formData.get("id"));
  const gameId = String(formData.get("gameId"));
  const title = String(formData.get("title"));
  const description = String(formData.get("description"));
  const priceRupiah = Number(formData.get("priceRupiah"));
  const etaLabel = String(formData.get("etaLabel"));
  const badge = String(formData.get("badge") || "").trim();
  const isActive = formData.get("isActive") === "on";

  const resolved = await resolveRelationInputs(formData);
  if ("error" in resolved) {
    return { error: resolved.error };
  }

  const rawatAkun = resolveRawatAkunInputs(formData, resolved.isRawatAkun);
  if (rawatAkun.isPatchWide && !rawatAkun.patchId) {
    return { error: "Pilih Patch untuk Joki Item rawat akun bertipe 1 patch." };
  }
  if (resolved.isRawatAkun && !rawatAkun.isPatchWide && (!rawatAkun.durationDays || rawatAkun.durationDays <= 0)) {
    return { error: "Isi durasi per 1 unit (hari) untuk Joki Item rawat akun ini." };
  }

  const additional = resolveAdditionalFields(formData, resolved.requiresQuestType, resolved.isMaterial);

  const before = await prisma.jokiItem.findUnique({ where: { id }, select: { gameId: true } });

  await prisma.jokiItem.update({
    where: { id },
    data: {
      gameId,
      categoryId: resolved.categoryId,
      regionId: resolved.regionId,
      questTypeId: resolved.questTypeId,
      title,
      description,
      priceRupiah,
      etaLabel,
      badge: badge || null,
      isActive,
      includeEvent: rawatAkun.includeEvent,
      isPatchWide: rawatAkun.isPatchWide,
      patchId: rawatAkun.patchId,
      durationDays: rawatAkun.durationDays,
      actNumber: additional.actNumber,
      unitQuantity: additional.unitQuantity,
      endgameContent: {
        deleteMany: {},
        create: rawatAkun.endgameContentIds.map((endgameContentId) => ({ endgameContentId })),
      },
    },
  });

  revalidatePath("/admin/joki");
  revalidatePath("/joki");
  revalidatePath("/");

  // Notify game baru, dan kalau item dipindah ke game lain, notify game
  // lama juga (supaya tabel harga game lama ikut ter-update, item-nya hilang).
  const affectedGameIds = Array.from(new Set([gameId, before?.gameId].filter((v): v is string => !!v)));
  const affectedGames = await prisma.game.findMany({
    where: { id: { in: affectedGameIds } },
    select: { slug: true },
  });
  for (const g of affectedGames) notifyPriceListChanged(g.slug);

  return {};
}

export async function deleteJokiItem(formData: FormData) {
  const id = String(formData.get("id"));
  const deleted = await prisma.jokiItem.delete({
    where: { id },
    select: { game: { select: { slug: true } } },
  });

  revalidatePath("/admin/joki");
  revalidatePath("/joki");
  revalidatePath("/");

  notifyPriceListChanged(deleted.game.slug);
}

// ---------- Kategori ----------

export async function createJokiCategory(formData: FormData) {
  const gameId = String(formData.get("gameId"));
  const name = String(formData.get("name"));
  const requiresRegion = formData.get("requiresRegion") === "on";
  const requiresQuestType = formData.get("requiresQuestType") === "on";
  const isRawatAkun = formData.get("isRawatAkun") === "on";
  const isMaterial = formData.get("isMaterial") === "on";
  const requiresCharacterLevel = formData.get("requiresCharacterLevel") === "on";

  await prisma.jokiCategory.create({
    data: { gameId, name, requiresRegion, requiresQuestType, isRawatAkun, isMaterial, requiresCharacterLevel },
  });

  revalidatePath("/admin/kategori");
  revalidatePath("/admin/joki");
}

export async function updateJokiCategory(formData: FormData) {
  const id = String(formData.get("id"));
  const name = String(formData.get("name"));
  const requiresRegion = formData.get("requiresRegion") === "on";
  const requiresQuestType = formData.get("requiresQuestType") === "on";
  const isRawatAkun = formData.get("isRawatAkun") === "on";
  const isMaterial = formData.get("isMaterial") === "on";
  const requiresCharacterLevel = formData.get("requiresCharacterLevel") === "on";
  const isActive = formData.get("isActive") === "on";

  await prisma.jokiCategory.update({
    where: { id },
    data: { name, requiresRegion, requiresQuestType, isRawatAkun, isMaterial, requiresCharacterLevel, isActive },
  });

  revalidatePath("/admin/kategori");
  revalidatePath("/admin/joki");
}

export async function deleteJokiCategory(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.jokiCategory.delete({ where: { id } });

  revalidatePath("/admin/kategori");
  revalidatePath("/admin/joki");
}

// ---------- Region ----------

export async function createGameRegion(formData: FormData) {
  const gameId = String(formData.get("gameId"));
  const name = String(formData.get("name"));

  await prisma.gameRegion.create({ data: { gameId, name } });

  revalidatePath("/admin/region");
  revalidatePath("/admin/joki");
}

export async function updateGameRegion(formData: FormData) {
  const id = String(formData.get("id"));
  const name = String(formData.get("name"));
  const isActive = formData.get("isActive") === "on";

  await prisma.gameRegion.update({ where: { id }, data: { name, isActive } });

  revalidatePath("/admin/region");
  revalidatePath("/admin/joki");
}

export async function deleteGameRegion(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.gameRegion.delete({ where: { id } });

  revalidatePath("/admin/region");
  revalidatePath("/admin/joki");
}

// ---------- Quest Type ----------

export async function createQuestType(formData: FormData) {
  const gameId = String(formData.get("gameId"));
  const name = String(formData.get("name"));
  const isRegionSpecific = formData.get("isRegionSpecific") === "on";
  const questKind = String(formData.get("questKind") || "LAINNYA") as "WORLD" | "ARCHON" | "LAINNYA";

  await prisma.questType.create({ data: { gameId, name, isRegionSpecific, questKind } });

  revalidatePath("/admin/quest");
  revalidatePath("/admin/joki");
  revalidatePath("/admin/paket");
}

export async function updateQuestType(formData: FormData) {
  const id = String(formData.get("id"));
  const name = String(formData.get("name"));
  const isRegionSpecific = formData.get("isRegionSpecific") === "on";
  const questKind = String(formData.get("questKind") || "LAINNYA") as "WORLD" | "ARCHON" | "LAINNYA";
  const isActive = formData.get("isActive") === "on";

  await prisma.questType.update({
    where: { id },
    data: { name, isRegionSpecific, questKind, isActive },
  });

  revalidatePath("/admin/quest");
  revalidatePath("/admin/joki");
  revalidatePath("/admin/paket");
}

export async function deleteQuestType(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.questType.delete({ where: { id } });

  revalidatePath("/admin/quest");
  revalidatePath("/admin/joki");
}