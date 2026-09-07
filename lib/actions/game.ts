"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { GameSlug } from "@prisma/client";

export async function createGame(formData: FormData) {
  const slug = String(formData.get("slug")) as GameSlug;
  const name = String(formData.get("name"));
  const tagline = String(formData.get("tagline"));
  const accentColor = String(formData.get("accentColor"));

  await prisma.game.create({
    data: { slug, name, tagline, accentColor },
  });

  revalidatePath("/admin/game");
  revalidatePath("/");
  revalidatePath("/joki");
}

export async function updateGame(formData: FormData) {
  const id = String(formData.get("id"));
  const name = String(formData.get("name"));
  const tagline = String(formData.get("tagline"));
  const accentColor = String(formData.get("accentColor"));

  await prisma.game.update({
    where: { id },
    data: { name, tagline, accentColor },
  });

  revalidatePath("/admin/game");
  revalidatePath("/");
  revalidatePath("/joki");
}

export async function deleteGame(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.game.delete({ where: { id } });

  revalidatePath("/admin/game");
  revalidatePath("/");
  revalidatePath("/joki");
}
