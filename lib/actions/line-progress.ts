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

async function recalculateOrderProgress(orderLineId: string) {
  const line = await prisma.orderLine.findUnique({
    where: { id: orderLineId },
    select: {
      orderId: true,
      order: { select: { customer: { select: { publicSlug: true } } } },
    },
  });
  if (!line) return;

  const lines = await prisma.orderLine.findMany({
    where: { orderId: line.orderId },
    select: { isCompleted: true, progressPercent: true, progressCurrent: true, actFrom: true, actTo: true, materialQuantity: true },
  });

  const percentages = lines.map((item) => {
    if (item.isCompleted) return 100;
    if (item.progressPercent != null) return Math.max(0, Math.min(100, item.progressPercent));
    const target = item.actFrom != null && item.actTo != null
      ? item.actTo - item.actFrom + 1
      : item.materialQuantity;
    return target && target > 0
      ? Math.max(0, Math.min(100, Math.round(((item.progressCurrent ?? 0) / target) * 100)))
      : 0;
  });
  const progressPct = percentages.length > 0
    ? Math.round(percentages.reduce((sum, percent) => sum + percent, 0) / percentages.length)
    : 0;

  await prisma.order.update({ where: { id: line.orderId }, data: { progressPct } });
  revalidatePath("/admin/antrian");
  revalidatePath(`/admin/progress/${line.orderId}`);
  revalidatePath(`/progress/${line.order.customer.publicSlug}`);
}

export async function toggleOrderLineCompletion(formData: FormData) {
  const orderLineId = String(formData.get("orderLineId") || "").trim();
  const isCompleted = String(formData.get("isCompleted") || "false") === "true";
  if (!orderLineId) return;

  await prisma.orderLine.update({
    where: { id: orderLineId },
    data: { isCompleted },
  });
  await recalculateOrderProgress(orderLineId);
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

  await recalculateOrderProgress(orderLineId);
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

  await recalculateOrderProgress(orderLineId);
  await revalidateForOrderLine(orderLineId);
}
