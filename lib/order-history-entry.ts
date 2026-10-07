import { prisma } from "@/lib/prisma";
import type { HistoryEntryPayload, HistoryLinePayload } from "./discord-history-notify";

/**
 * Bangun HistoryEntryPayload untuk SATU order (dipanggil tepat setelah
 * status order itu berubah jadi SELESAI). Return null kalau order tidak
 * ditemukan atau belum SELESAI (safety check, seharusnya tidak pernah
 * terjadi kalau dipanggil di tempat yang benar).
 *
 * siteOrigin: base URL situs ini sendiri (mis. "https://shihuservice.com"),
 * dipakai untuk membentuk link publik /progress/[slug]. Di route handler
 * API bisa diambil dari `new URL(req.url).origin`; di Server Action (tidak
 * ada request HTTP masuk) harus diisi manual, mis. dari env
 * NEXT_PUBLIC_SITE_URL atau konstanta yang sudah ada di project ini.
 */
export async function getHistoryEntryForOrder(
  orderId: string,
  siteOrigin: string,
): Promise<HistoryEntryPayload | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderCode: true,
      status: true,
      completedAt: true,
      updatedAt: true,
      jokerName: true,
      customer: { select: { name: true, publicSlug: true } },
      worker: { select: { name: true } },
      game: { select: { slug: true, name: true } },
      lines: {
        select: {
          characterName: true,
          jokiItem: { select: { title: true, category: { select: { isRawatAkun: true } } } },
          jokiPaket: { select: { title: true } },
          patchEvent: { select: { title: true } },
          endgameContent: { select: { title: true } },
          updates: { select: { screenshotUrl: true } },
          dayProgress: { select: { screenshotUrls: true } },
        },
      },
    },
  });

  if (!order || order.status !== "SELESAI") return null;

  const lines: HistoryLinePayload[] = order.lines.map((line) => {
    const isRawatAkun = line.jokiItem?.category.isRawatAkun ?? false;
    const title =
      (line.jokiItem?.title ??
        line.jokiPaket?.title ??
        line.patchEvent?.title ??
        line.endgameContent?.title ??
        "Item tidak dikenal") + (line.characterName ? ` — ${line.characterName}` : "");

    const updateShots = line.updates.map((u) => u.screenshotUrl).filter((u): u is string => Boolean(u));
    const dayShots = isRawatAkun ? line.dayProgress.flatMap((d) => d.screenshotUrls) : [];

    return { title, isRawatAkun, screenshotUrls: [...updateShots, ...dayShots] };
  });

  return {
    id: `order:${order.id}`,
    source: "order",
    orderCode: order.orderCode,
    gameSlug: order.game.slug,
    gameName: order.game.name,
    customerName: order.customer.name,
    jokerName: order.worker?.name ?? order.jokerName ?? null,
    completedAt: (order.completedAt ?? order.updatedAt).toISOString(),
    publicUrl: `${siteOrigin}/progress/${order.customer.publicSlug}`,
    lines,
  };
}

/**
 * Sama seperti di atas, tapi untuk SATU JokiHistoryEntry manual (dipanggil
 * tepat setelah createJokiHistoryEntry berhasil membuat entrinya).
 */
export async function getHistoryEntryForManualEntry(
  entryId: string,
  siteOrigin: string,
): Promise<HistoryEntryPayload | null> {
  const entry = await prisma.jokiHistoryEntry.findUnique({
    where: { id: entryId },
    select: {
      id: true,
      title: true,
      jokerName: true,
      completedAt: true,
      screenshotUrls: true,
      customer: { select: { name: true, publicSlug: true } },
      game: { select: { slug: true, name: true } },
    },
  });

  if (!entry) return null;

  return {
    id: `manual:${entry.id}`,
    source: "manual",
    orderCode: null,
    gameSlug: entry.game.slug,
    gameName: entry.game.name,
    customerName: entry.customer.name,
    jokerName: entry.jokerName,
    completedAt: entry.completedAt.toISOString(),
    publicUrl: entry.customer.publicSlug ? `${siteOrigin}/progress/${entry.customer.publicSlug}` : null,
    lines: [{ title: entry.title, isRawatAkun: false, screenshotUrls: entry.screenshotUrls }],
  };
}
