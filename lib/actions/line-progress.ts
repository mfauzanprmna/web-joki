"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function revalidateForOrderLine(orderLineId: string) {
  const line = await prisma.orderLine.findUnique({
    where: { id: orderLineId },
    select: { orderId: true, order: { select: { customer: { select: { publicSlug: true } } } } },
  });
  if (!line) return;
  revalidatePath("/admin/antrian");
  revalidatePath(`/admin/progress/${line.orderId}`);
  revalidatePath(`/progress/${line.order.customer.publicSlug}`);
}

/** Update progress Eksplorasi (persen area yang sudah dieksplor sejauh ini, 0-100). */
export async function updateExplorationProgress(formData: FormData) {
  const orderLineId = String(formData.get("orderLineId") || "").trim();
  const percent = Math.max(0, Math.min(100, Number(formData.get("percent") || 0)));
  if (!orderLineId) return;

  await prisma.orderLine.update({
    where: { id: orderLineId },
    data: { progressPercent: percent },
  });

  await revalidateForOrderLine(orderLineId);
}

/**
 * Update progress Quest/Material (jumlah yang sudah selesai/diambil dari
 * total target). Target dikirim dari client sekadar buat clamp nilai
 * maksimal supaya tidak melebihi total (bukan disimpan ke DB, karena target
 * sudah bisa dihitung ulang kapan saja dari actFrom/actTo atau
 * materialQuantity).
 */
export async function updateCountProgress(formData: FormData) {
  const orderLineId = String(formData.get("orderLineId") || "").trim();
  const target = Math.max(0, Number(formData.get("target") || 0));
  const current = Math.max(0, Math.min(target || Number.MAX_SAFE_INTEGER, Number(formData.get("current") || 0)));
  if (!orderLineId) return;

  await prisma.orderLine.update({
    where: { id: orderLineId },
    data: { progressCurrent: current },
  });

  await revalidateForOrderLine(orderLineId);
}
