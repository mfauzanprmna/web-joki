"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createTestimonial(formData: FormData) {
  const gameId = String(formData.get("gameId"));
  const orderId = String(formData.get("orderId") || "").trim();
  const customerName = String(formData.get("customerName"));
  const rating = Number(formData.get("rating"));
  const message = String(formData.get("message"));

  await prisma.testimonial.create({
    data: {
      gameId,
      orderId: orderId || null,
      customerName,
      rating,
      message,
    },
  });

  revalidatePath("/admin/testimoni");
  revalidatePath("/testimoni");
}

export async function updateTestimonial(formData: FormData) {
  const id = String(formData.get("id"));
  const customerName = String(formData.get("customerName"));
  const rating = Number(formData.get("rating"));
  const message = String(formData.get("message"));
  const isPublished = formData.get("isPublished") === "on";

  await prisma.testimonial.update({
    where: { id },
    data: { customerName, rating, message, isPublished },
  });

  revalidatePath("/admin/testimoni");
  revalidatePath("/testimoni");
}

export async function deleteTestimonial(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.testimonial.delete({ where: { id } });

  revalidatePath("/admin/testimoni");
  revalidatePath("/testimoni");
}

export interface SubmitTestimonialState {
  error?: string;
  success?: boolean;
}

/**
 * Testimoni yang dikirim CUSTOMER sendiri lewat halaman /progress/[slug]
 * (bukan lewat admin). Selalu terikat ke satu Order milik customer tsb yang
 * statusnya sudah SELESAI, supaya testimoni otomatis "terverifikasi" (tidak
 * perlu isi ulang nama game/paket -- diambil dari Order) dan tidak bisa
 * dikirim dobel (Testimonial.orderId unique). Selalu masuk sebagai
 * isPublished=false dulu, menunggu admin approve di /admin/testimoni
 * supaya tetap ada gerbang moderasi sebelum tayang publik.
 */
export async function submitCustomerTestimonial(
  _prevState: SubmitTestimonialState | undefined,
  formData: FormData
): Promise<SubmitTestimonialState> {
  const orderId = String(formData.get("orderId") || "").trim();
  const customerName = String(formData.get("customerName") || "").trim();
  const rating = Number(formData.get("rating") || 0);
  const message = String(formData.get("message") || "").trim();

  if (!orderId) return { error: "Pesanan tidak ditemukan." };
  if (!customerName) return { error: "Nama wajib diisi." };
  if (!message) return { error: "Pesan testimoni wajib diisi." };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Pilih rating bintang 1-5 dulu." };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      gameId: true,
      status: true,
      testimonial: { select: { id: true } },
      customer: { select: { publicSlug: true } },
    },
  });

  if (!order) return { error: "Pesanan tidak ditemukan." };
  if (order.status !== "SELESAI") {
    return { error: "Testimoni cuma bisa dikirim untuk pesanan yang sudah selesai." };
  }
  if (order.testimonial) {
    return { error: "Pesanan ini sudah punya testimoni." };
  }

  await prisma.testimonial.create({
    data: {
      gameId: order.gameId,
      orderId: order.id,
      customerName,
      rating,
      message,
      isPublished: false,
    },
  });

  revalidatePath(`/progress/${order.customer.publicSlug}`);
  revalidatePath("/admin/testimoni");
  revalidatePath("/testimoni");
  return { success: true };
}

/**
 * Testimoni yang dikirim customer LAMA (joki yang selesai sebelum web ini
 * ada, jadi tidak punya Order/akun) lewat link publik
 * /testimoni-lama/[shareToken] yang di-share manual oleh admin dari halaman
 * /admin/history-joki. Sama seperti submitCustomerTestimonial: selalu masuk
 * isPublished=false dulu, dan cuma bisa 1x per entry (JokiHistoryEntry ->
 * Testimonial 1-1).
 */
export async function submitJokiHistoryTestimonial(
  _prevState: SubmitTestimonialState | undefined,
  formData: FormData
): Promise<SubmitTestimonialState> {
  const shareToken = String(formData.get("shareToken") || "").trim();
  const customerName = String(formData.get("customerName") || "").trim();
  const rating = Number(formData.get("rating") || 0);
  const message = String(formData.get("message") || "").trim();

  if (!shareToken) return { error: "Link testimoni tidak valid." };
  if (!customerName) return { error: "Nama wajib diisi." };
  if (!message) return { error: "Pesan testimoni wajib diisi." };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Pilih rating bintang 1-5 dulu." };
  }

  const entry = await prisma.jokiHistoryEntry.findUnique({
    where: { shareToken },
    select: { id: true, gameId: true, testimonial: { select: { id: true } } },
  });

  if (!entry) return { error: "Link testimoni tidak ditemukan." };
  if (entry.testimonial) return { error: "Joki ini sudah punya testimoni." };

  await prisma.testimonial.create({
    data: {
      gameId: entry.gameId,
      jokiHistoryEntryId: entry.id,
      customerName,
      rating,
      message,
      isPublished: false,
    },
  });

  revalidatePath(`/testimoni-lama/${shareToken}`);
  revalidatePath("/admin/testimoni");
  revalidatePath("/admin/history-joki");
  revalidatePath("/testimoni");
  return { success: true };
}