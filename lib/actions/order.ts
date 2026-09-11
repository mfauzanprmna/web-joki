"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { calculateJokiItemLinePrice } from "@/lib/order-pricing";
import { computeRawatAkunPeriod } from "@/lib/rawat-akun-schedule";
import { createUniqueCustomerSlug } from "./customer";
import { notifyOrderCreated, notifyOrderProgress } from "@/lib/discord-notify";
import { isPatchEventLive } from "@/lib/patch-schedule";

export interface OrderActionState {
  error?: string;
}

function generateOrderCode(usedCodes: Set<string>): string {
  let code: string;
  do {
    const n = Math.floor(10000 + Math.random() * 90000);
    code = `ECL-${n}`;
  } while (usedCodes.has(code));
  usedCodes.add(code);
  return code;
}

interface LineInputRaw {
  type: "item" | "paket" | "event";
  id: string;
  explorationPercent: number | null;
  actFrom: number | null;
  actTo: number | null;
  materialQuantity: number | null;
  rawatAkunQuantity: number | null;
  rawatAkunStartDate: string | null;
}

interface AccountInputRaw {
  gameId: string;
  jokerName: string | null;
  estimasiJoki: string | null;
  lines: LineInputRaw[];
}

function parseLine(raw: unknown): LineInputRaw | { error: string } {
  if (
    typeof raw !== "object" ||
    raw === null ||
    (raw as { type?: unknown }).type == null ||
    (raw as { id?: unknown }).id == null
  ) {
    return { error: "Data baris order tidak valid." };
  }
  const e = raw as Record<string, unknown>;
  if (e.type !== "item" && e.type !== "paket" && e.type !== "event") {
    return { error: "Data baris order tidak valid." };
  }
  return {
    type: e.type,
    id: String(e.id),
    explorationPercent: e.explorationPercent != null ? Number(e.explorationPercent) : null,
    actFrom: e.actFrom != null ? Number(e.actFrom) : null,
    actTo: e.actTo != null ? Number(e.actTo) : null,
    materialQuantity: e.materialQuantity != null ? Number(e.materialQuantity) : null,
    rawatAkunQuantity: e.rawatAkunQuantity != null ? Number(e.rawatAkunQuantity) : null,
    rawatAkunStartDate: e.rawatAkunStartDate ? String(e.rawatAkunStartDate) : null,
  };
}

/**
 * Parse & validasi field JSON "accountsJson" yang dikirim form: array akun,
 * masing-masing merepresentasikan satu tab/Order terpisah, dengan game dan
 * baris Joki Item/Paket sendiri-sendiri.
 */
function parseAccountsJson(formData: FormData): { accounts: AccountInputRaw[] } | { error: string } {
  const raw = String(formData.get("accountsJson") || "");
  if (!raw) {
    return { error: "Data akun tidak ditemukan." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "Data akun tidak valid." };
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return { error: "Isi minimal satu akun untuk order ini." };
  }

  const accounts: AccountInputRaw[] = [];
  for (const entry of parsed) {
    if (typeof entry !== "object" || entry === null) {
      return { error: "Data akun tidak valid." };
    }
    const e = entry as Record<string, unknown>;
    const gameId = String(e.gameId || "");
    if (!gameId) {
      return { error: "Setiap akun wajib memilih game." };
    }
    if (!Array.isArray(e.lines) || e.lines.length === 0) {
      return { error: "Setiap akun wajib memilih minimal satu Joki Item atau Paket Joki." };
    }
    const lines: LineInputRaw[] = [];
    for (const rawLine of e.lines) {
      const parsedLine = parseLine(rawLine);
      if ("error" in parsedLine) {
        return { error: parsedLine.error };
      }
      lines.push(parsedLine);
    }
    accounts.push({
      gameId,
      jokerName: e.jokerName ? String(e.jokerName).trim() || null : null,
      estimasiJoki: e.estimasiJoki ? String(e.estimasiJoki).trim() || null : null,
      lines,
    });
  }

  return { accounts };
}

export async function createOrder(
  _prevState: OrderActionState | undefined,
  formData: FormData
): Promise<OrderActionState> {
  const customerId = String(formData.get("customerId") || "").trim();
  const newCustomerName = String(formData.get("newCustomerName") || "").trim();

  if (!customerId && !newCustomerName) {
    return { error: "Pilih customer yang sudah ada, atau isi nama customer baru." };
  }

  const orderSource = String(formData.get("orderSource") || "") as
    | "DISCORD"
    | "INSTAGRAM"
    | "TIKTOK"
    | "WHATSAPP"
    | "";
  const sourceUsername = String(formData.get("sourceUsername") || "").trim();
  const sourceWhatsapp = String(formData.get("sourceWhatsapp") || "").trim();

  const validSources = ["DISCORD", "INSTAGRAM", "TIKTOK", "WHATSAPP"];
  if (!validSources.includes(orderSource)) {
    return { error: "Pilih tempat order (Discord/Instagram/TikTok/WhatsApp)." };
  }
  if (!sourceUsername) {
    return { error: "Username wajib diisi." };
  }
  if (orderSource === "WHATSAPP" && !sourceWhatsapp) {
    return { error: "Nomor WhatsApp wajib diisi untuk order dari WhatsApp." };
  }

  const parsedAccounts = parseAccountsJson(formData);
  if ("error" in parsedAccounts) {
    return { error: parsedAccounts.error };
  }

  // Kumpulkan semua itemId/paketId dari SELURUH akun sekaligus, supaya cukup
  // satu query masing-masing (bukan per-akun berulang).
  const allItemIds = new Set<string>();
  const allPaketIds = new Set<string>();
  const allEventIds = new Set<string>();
  for (const acc of parsedAccounts.accounts) {
    for (const line of acc.lines) {
      if (line.type === "item") allItemIds.add(line.id);
      else if (line.type === "paket") allPaketIds.add(line.id);
      else allEventIds.add(line.id);
    }
  }

  const items =
    allItemIds.size > 0
      ? await prisma.jokiItem.findMany({
          where: { id: { in: Array.from(allItemIds) } },
          include: { category: true, patch: { select: { startDate: true, endDate: true } } },
        })
      : [];
  const pakets =
    allPaketIds.size > 0
      ? await prisma.jokiPaket.findMany({ where: { id: { in: Array.from(allPaketIds) } } })
      : [];
  const events =
    allEventIds.size > 0
      ? await prisma.patchEvent.findMany({
          where: { id: { in: Array.from(allEventIds) } },
          include: { patch: { select: { gameId: true } } },
        })
      : [];

  const itemMap = new Map(items.map((i) => [i.id, i]));
  const paketMap = new Map(pakets.map((p) => [p.id, p]));
  const eventMap = new Map(events.map((event) => [event.id, event]));

  interface ResolvedAccount {
    gameId: string;
    jokerName: string | null;
    estimasiJoki: string | null;
    totalPrice: number;
    lines: {
      jokiItemId: string | null;
      jokiPaketId: string | null;
      patchEventId: string | null;
      explorationPercent: number | null;
      actFrom: number | null;
      actTo: number | null;
      materialQuantity: number | null;
      rawatAkunQuantity: number | null;
      startDate: Date | null;
      endDate: Date | null;
      calculatedPrice: number;
    }[];
  }

  const resolvedAccounts: ResolvedAccount[] = [];

  for (const acc of parsedAccounts.accounts) {
    const linesToCreate: ResolvedAccount["lines"] = [];

    for (const line of acc.lines) {
      if (line.type === "item") {
        const item = itemMap.get(line.id);
        if (!item) {
          return { error: "Salah satu Joki Item yang dipilih tidak ditemukan." };
        }
        const result = calculateJokiItemLinePrice(item, line);
        if (!result.valid) {
          return { error: `${item.title}: ${result.error}` };
        }

        let startDate: Date | null = null;
        let endDate: Date | null = null;
        if (item.category.isRawatAkun) {
          const quantity = line.rawatAkunQuantity ?? 1;
          const requestedStart = line.rawatAkunStartDate ? new Date(`${line.rawatAkunStartDate}T00:00:00`) : new Date();
          const period = computeRawatAkunPeriod(
            { isPatchWide: item.isPatchWide, durationDays: item.durationDays, patch: item.patch },
            quantity,
            requestedStart
          );
          if (!period) {
            return {
              error: `${item.title}: durasi (hari) Joki Item ini belum diisi, tidak bisa menghitung tanggal selesai.`,
            };
          }
          startDate = period.startDate;
          endDate = period.endDate;
        }

        linesToCreate.push({
          jokiItemId: item.id,
          jokiPaketId: null,
          patchEventId: null,
          explorationPercent: line.explorationPercent,
          actFrom: line.actFrom,
          actTo: line.actTo,
          materialQuantity: line.materialQuantity,
          rawatAkunQuantity: line.rawatAkunQuantity,
          startDate,
          endDate,
          calculatedPrice: result.price,
        });
      } else if (line.type === "paket") {
        const paket = paketMap.get(line.id);
        if (!paket) {
          return { error: "Salah satu Paket Joki yang dipilih tidak ditemukan." };
        }
        linesToCreate.push({
          jokiItemId: null,
          jokiPaketId: paket.id,
          patchEventId: null,
          explorationPercent: null,
          actFrom: null,
          actTo: null,
          materialQuantity: null,
          rawatAkunQuantity: null,
          startDate: null,
          endDate: null,
          calculatedPrice: paket.priceRupiah,
        });
      } else {
        const event = eventMap.get(line.id);
        if (!event || !isPatchEventLive(event)) {
          return { error: "Salah satu event yang dipilih sudah tidak sedang berjalan." };
        }
        if (event.patch.gameId !== acc.gameId) {
          return { error: "Event yang dipilih tidak sesuai dengan game akun ini." };
        }
        linesToCreate.push({
          jokiItemId: null,
          jokiPaketId: null,
          patchEventId: event.id,
          explorationPercent: null,
          actFrom: null,
          actTo: null,
          materialQuantity: null,
          rawatAkunQuantity: null,
          startDate: null,
          endDate: null,
          calculatedPrice: event.priceRupiah,
        });
      }
    }

    resolvedAccounts.push({
      gameId: acc.gameId,
      jokerName: acc.jokerName,
      estimasiJoki: acc.estimasiJoki,
      totalPrice: linesToCreate.reduce((sum, l) => sum + l.calculatedPrice, 0),
      lines: linesToCreate,
    });
  }

  // Generate publicSlug DI LUAR transaksi (butuh query findUnique tersendiri
  // untuk memastikan keunikan) -- hanya diperlukan kalau customer baru dibuat.
  const newCustomerSlug = !customerId ? await createUniqueCustomerSlug() : null;

  // Kumpulkan info tiap akun yang berhasil dibuat, dipakai untuk notifikasi
  // Discord SETELAH transaksi commit (supaya tidak ada notif untuk order
  // yang ternyata gagal tersimpan).
  const createdForNotify: {
    orderCode: string;
    gameId: string;
    layanan: string;
    totalPrice: number;
  }[] = [];

  // Semua akun (Order) dibuat dalam satu transaksi: kalau salah satu akun
  // gagal (mis. constraint DB), tidak ada Order yang tersimpan setengah-setengah.
  const usedCodes = new Set<string>();
  let resolvedCustomerId = "";
  await prisma.$transaction(async (tx) => {
    resolvedCustomerId =
      customerId ||
      (
        await tx.customer.create({
          data: { name: newCustomerName, publicSlug: newCustomerSlug! },
        })
      ).id;

    for (const acc of resolvedAccounts) {
      const orderCode = generateOrderCode(usedCodes);
      await tx.order.create({
        data: {
          orderCode,
          gameId: acc.gameId,
          customerId: resolvedCustomerId,
          jokerName: acc.jokerName,
          estimasiJoki: acc.estimasiJoki,
          status: "MENUNGGU",
          progressPct: 0,
          totalPrice: acc.totalPrice,
          orderSource: orderSource as "DISCORD" | "INSTAGRAM" | "TIKTOK" | "WHATSAPP",
          sourceUsername,
          sourceWhatsapp: orderSource === "WHATSAPP" ? sourceWhatsapp : null,
          lines: { create: acc.lines },
        },
      });

      createdForNotify.push({
        orderCode,
        gameId: acc.gameId,
        layanan: acc.lines
          .map((l) =>
            l.jokiItemId
              ? itemMap.get(l.jokiItemId)?.title
              : l.jokiPaketId
                ? paketMap.get(l.jokiPaketId)?.title
                : l.patchEventId
                  ? eventMap.get(l.patchEventId)?.title
                  : null,
          )
          .filter((title): title is string => !!title)
          .join(", ") || "Pesanan kustom",
        totalPrice: acc.totalPrice,
      });
    }
  });

  revalidatePath("/admin/antrian");
  revalidatePath("/admin/customer");
  revalidatePath("/antrian");
  revalidatePath("/history");

  // Notifikasi Discord dikirim TERPISAH dari transaksi DB di atas (fire-and-
  // forget, lihat lib/discord-notify.ts) -- kalau bot down, order tetap
  // sukses dibuat, cuma notifnya yang tidak terkirim.
  if (createdForNotify.length > 0) {
    const [customer, games] = await Promise.all([
      prisma.customer.findUnique({
        where: { id: resolvedCustomerId },
        select: { name: true, publicSlug: true },
      }),
      prisma.game.findMany({
        where: { id: { in: createdForNotify.map((c) => c.gameId) } },
        select: { id: true, name: true },
      }),
    ]);
    const gameNameById = new Map(games.map((g) => [g.id, g.name]));

    if (customer) {
      for (const created of createdForNotify) {
        notifyOrderCreated({
          orderCode: created.orderCode,
          customerName: customer.name,
          gameName: gameNameById.get(created.gameId) ?? "-",
          layanan: created.layanan,
          totalPrice: created.totalPrice,
          status: "MENUNGGU",
          publicSlug: customer.publicSlug,
        });
      }
    }
  }

  return {};
}

export async function updateOrder(formData: FormData) {
  const id = String(formData.get("id"));
  const jokerName = String(formData.get("jokerName") || "").trim();
  const status = String(formData.get("status"));
  const progressPct = Number(formData.get("progressPct"));
  const estimasiJoki = String(formData.get("estimasiJoki") || "").trim();

  const data: {
    jokerName: string | null;
    status: "MENUNGGU" | "DIKERJAKAN" | "FINISHING" | "SELESAI" | "DIBATALKAN";
    progressPct: number;
    estimasiJoki: string | null;
    completedAt?: Date;
  } = {
    jokerName: jokerName || null,
    status: status as "MENUNGGU" | "DIKERJAKAN" | "FINISHING" | "SELESAI" | "DIBATALKAN",
    progressPct,
    estimasiJoki: estimasiJoki || null,
  };

  if (status === "SELESAI") {
    data.completedAt = new Date();
    data.progressPct = 100;
  }

  const updated = await prisma.order.update({
    where: { id },
    data,
    select: {
      orderCode: true,
      status: true,
      progressPct: true,
      customer: { select: { publicSlug: true } },
    },
  });

  revalidatePath("/admin/antrian");
  revalidatePath("/antrian");
  revalidatePath("/history");

  // Fire-and-forget: kirim update progress/status ke Discord (lihat catatan
  // di lib/discord-notify.ts -- tidak akan menggagalkan update ini kalau
  // bot sedang tidak bisa dihubungi).
  notifyOrderProgress({
    orderCode: updated.orderCode,
    status: updated.status,
    progressPct: updated.progressPct,
    publicSlug: updated.customer.publicSlug,
  });
}

export async function deleteOrder(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.order.delete({ where: { id } });

  revalidatePath("/admin/antrian");
  revalidatePath("/antrian");
  revalidatePath("/history");
}
