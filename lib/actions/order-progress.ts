"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface OrderLineUpdateActionState {
  error?: string;
}

export async function addOrderLineUpdate(
  _prevState: OrderLineUpdateActionState | undefined,
  formData: FormData
): Promise<OrderLineUpdateActionState> {
  const orderLineId = String(formData.get("orderLineId") || "").trim();
  const note = String(formData.get("note") || "").trim();
  const screenshotUrl = String(formData.get("screenshotUrl") || "").trim();
  const resetLocation = String(formData.get("resetLocation") || "").trim();

  if (!orderLineId) {
    return { error: "OrderLine tidak ditemukan." };
  }

  if (!note && !screenshotUrl && !resetLocation) {
    return { error: "Isi minimal salah satu: catatan, link screenshot, atau lokasi reset." };
  }

  if (screenshotUrl) {
    try {
      const parsed = new URL(screenshotUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return { error: "Link screenshot harus URL http/https yang valid." };
      }
    } catch {
      return { error: "Link screenshot harus URL yang valid." };
    }
  }

  const orderLine = await prisma.orderLine.findUnique({
    where: { id: orderLineId },
    select: { orderId: true, order: { select: { customer: { select: { publicSlug: true } } } } },
  });
  if (!orderLine) {
    return { error: "OrderLine tidak ditemukan." };
  }

  await prisma.orderLineUpdate.create({
    data: {
      orderLineId,
      note: note || null,
      screenshotUrl: screenshotUrl || null,
      resetLocation: resetLocation || null,
    },
  });

  revalidatePath("/admin/antrian");
  revalidatePath(`/admin/progress/${orderLine.orderId}`);
  revalidatePath(`/progress/${orderLine.order.customer.publicSlug}`);

  return {};
}

export async function deleteOrderLineUpdate(formData: FormData) {
  const id = String(formData.get("id"));
  const orderLineId = String(formData.get("orderLineId") || "");

  await prisma.orderLineUpdate.delete({ where: { id } });

  revalidatePath("/admin/antrian");
  if (orderLineId) {
    const orderLine = await prisma.orderLine.findUnique({
      where: { id: orderLineId },
      select: { orderId: true, order: { select: { customer: { select: { publicSlug: true } } } } },
    });
    if (orderLine) {
      revalidatePath(`/admin/progress/${orderLine.orderId}`);
      revalidatePath(`/progress/${orderLine.order.customer.publicSlug}`);
    }
  }
}
