"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { startOfDay } from "@/lib/rawat-akun-schedule";

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

function parseDayDate(formData: FormData): Date {
  return startOfDay(new Date(String(formData.get("date") || "")));
}

export interface DayUpdateActionState {
  error?: string;
}

/** Tombol Quick Update (Selesai Hari Ini / Update 50% / 75% / Reset ke 0%) & input manual. */
export async function setDayPercent(formData: FormData) {
  const orderLineId = String(formData.get("orderLineId") || "").trim();
  const date = parseDayDate(formData);
  const percent = Math.max(0, Math.min(100, Number(formData.get("percent") || 0)));

  if (!orderLineId || Number.isNaN(date.getTime())) return;

  await prisma.orderLineDayProgress.upsert({
    where: { orderLineId_date: { orderLineId, date } },
    update: { percent },
    create: { orderLineId, date, percent },
  });

  await revalidateForOrderLine(orderLineId);
}

/** Form "Catatan Hari Ini" + tambah link screenshot untuk tanggal terpilih. */
export async function saveDayUpdate(
  _prevState: DayUpdateActionState | undefined,
  formData: FormData
): Promise<DayUpdateActionState> {
  const orderLineId = String(formData.get("orderLineId") || "").trim();
  const date = parseDayDate(formData);
  const note = String(formData.get("note") || "").trim();
  const screenshotUrl = String(formData.get("screenshotUrl") || "").trim();

  if (!orderLineId || Number.isNaN(date.getTime())) {
    return { error: "Baris pesanan atau tanggal tidak valid." };
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

  const existing = await prisma.orderLineDayProgress.findUnique({
    where: { orderLineId_date: { orderLineId, date } },
  });

  const nextScreenshots = screenshotUrl
    ? [...(existing?.screenshotUrls ?? []), screenshotUrl]
    : existing?.screenshotUrls ?? [];

  await prisma.orderLineDayProgress.upsert({
    where: { orderLineId_date: { orderLineId, date } },
    update: { note: note || null, screenshotUrls: nextScreenshots },
    create: { orderLineId, date, note: note || null, screenshotUrls: nextScreenshots },
  });

  await revalidateForOrderLine(orderLineId);
  return {};
}

export async function deleteDayScreenshot(formData: FormData) {
  const orderLineId = String(formData.get("orderLineId") || "").trim();
  const date = parseDayDate(formData);
  const url = String(formData.get("url") || "");
  if (!orderLineId || Number.isNaN(date.getTime())) return;

  const existing = await prisma.orderLineDayProgress.findUnique({
    where: { orderLineId_date: { orderLineId, date } },
  });
  if (!existing) return;

  await prisma.orderLineDayProgress.update({
    where: { orderLineId_date: { orderLineId, date } },
    data: { screenshotUrls: existing.screenshotUrls.filter((u) => u !== url) },
  });

  await revalidateForOrderLine(orderLineId);
}

/** Ubah status satu task checklist (dropdown auto-submit) + catatan opsional (jika dikirim). */
export async function updateDayTaskStatus(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  const status = String(formData.get("status") || "BELUM") as "BELUM" | "SEDANG" | "SELESAI";
  const orderLineId = String(formData.get("orderLineId") || "").trim();
  if (!id) return;

  const task = await prisma.orderLineDayTask.findUnique({ where: { id } });
  if (!task) return;

  if (task.sourceKey) {
    await prisma.orderLineDayTask.updateMany({
      where: { orderLineId: task.orderLineId, sourceKey: task.sourceKey },
      data: { status },
    });
  } else {
    await prisma.orderLineDayTask.update({ where: { id }, data: { status } });
  }

  if (formData.has("note")) {
    const note = String(formData.get("note") || "").trim();
    await prisma.orderLineDayTask.update({ where: { id }, data: { note: note || null } });
  }

  if (orderLineId) await revalidateForOrderLine(orderLineId);
}

/** Tambah task checklist manual ("Kelola Checklist" -> tambah task) untuk tanggal terpilih. */
export async function addDayTask(formData: FormData) {
  const orderLineId = String(formData.get("orderLineId") || "").trim();
  const date = parseDayDate(formData);
  const category = String(formData.get("category") || "").trim();
  const label = String(formData.get("label") || "").trim();
  if (!orderLineId || Number.isNaN(date.getTime()) || !category || !label) return;

  await prisma.orderLineDayTask.create({
    data: { orderLineId, date, category, label, sourceKey: null },
  });

  await revalidateForOrderLine(orderLineId);
}

export async function deleteDayTask(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  const orderLineId = String(formData.get("orderLineId") || "").trim();
  if (!id) return;

  const task = await prisma.orderLineDayTask.findUnique({ where: { id } });
  if (!task) return;

  if (task.sourceKey) {
    await prisma.orderLineDayTask.deleteMany({
      where: { orderLineId: task.orderLineId, sourceKey: task.sourceKey },
    });
  } else {
    await prisma.orderLineDayTask.delete({ where: { id } });
  }

  if (orderLineId) await revalidateForOrderLine(orderLineId);
}
