import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { GameSlug } from "@prisma/client";

/**
 * Endpoint ini dipanggil bot Discord (lihat fetchHistory di webApi.ts bot,
 * dipakai oleh /sync-history & /sync-data). Mengembalikan history (order
 * SELESAI + JokiHistoryEntry manual) digabung jadi satu daftar, diurutkan
 * completedAt ASCENDING, supaya bot bisa paginasi maju pakai `since`
 * (nextCursor dari response sebelumnya) tanpa harus tarik ulang semua data
 * dari awal tiap kali /sync-history dijalankan.
 *
 * Auth: header x-bot-secret harus cocok dengan DISCORD_BOT_SECRET -- SAMA
 * persis dengan yang dipakai endpoint /api/discord/* lain di project ini
 * (orders/[code], games/[slug]/pricelist, dst), jadi kalau endpoint lain
 * sudah jalan, env var ini seharusnya sudah ada.
 *
 * Query params:
 *  - game   (opsional) filter 1 game, mis. "genshin" | "wuwa" | "neverness"
 *  - since  (opsional) ISO timestamp, cuma ambil yang completedAt > ini
 *  - limit  (opsional) default 25, maksimal 50
 */

function checkSecret(req: NextRequest): boolean {
  const provided = req.headers.get("x-bot-secret");
  const expected = process.env.DISCORD_BOT_SECRET;
  return Boolean(expected) && provided === expected;
}

interface HistoryLine {
  title: string;
  isRawatAkun: boolean;
  screenshotUrls: string[];
}

interface HistoryEntry {
  id: string;
  source: "order" | "manual";
  orderCode: string | null;
  gameSlug: string;
  gameName: string;
  customerName: string;
  jokerName: string | null;
  completedAt: string;
  publicUrl: string | null;
  lines: HistoryLine[];
}

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 50;

export async function GET(req: NextRequest) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const gameSlugParam = searchParams.get("game") || undefined;
  const sinceParam = searchParams.get("since");
  const limitParam = Number(searchParams.get("limit"));
  const limit =
    Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, MAX_LIMIT) : DEFAULT_LIMIT;

  let sinceDate: Date | undefined;
  if (sinceParam) {
    sinceDate = new Date(sinceParam);
    if (Number.isNaN(sinceDate.getTime())) {
      return NextResponse.json(
        { error: "Parameter since tidak valid (harus ISO date)." },
        { status: 400 },
      );
    }
  }

  // Dasar URL progress customer -- diambil dari origin request itu sendiri
  // (request datang dari bot ke app Next.js yang sama), jadi otomatis benar
  // di dev maupun produksi tanpa perlu env var tambahan.
  const siteOrigin = new URL(req.url).origin;

  // Ambil lebih banyak dari masing-masing sumber daripada `limit` akhir,
  // karena nanti DIGABUNG dulu baru disortir+dipotong -- kalau langsung
  // take:limit per sumber, urutan completedAt gabungan bisa salah saat
  // jumlah dari order & history manual tidak seimbang dalam satu halaman.
  const fetchSize = limit * 2;

  const [orders, historyEntries] = await Promise.all([
    prisma.order.findMany({
      where: {
        status: "SELESAI",
        ...(gameSlugParam ? { game: { slug: gameSlugParam as GameSlug } } : {}),
        ...(sinceDate ? { completedAt: { gt: sinceDate } } : {}),
      },
      select: {
        id: true,
        orderCode: true,
        completedAt: true,
        updatedAt: true,
        jokerName: true,
        customer: { select: { name: true, publicSlug: true } },
        worker: { select: { name: true } },
        game: { select: { slug: true, name: true } },
        lines: {
          select: {
            characterName: true,
            jokiItem: {
              select: { title: true, category: { select: { isRawatAkun: true } } },
            },
            jokiPaket: { select: { title: true } },
            patchEvent: { select: { title: true } },
            endgameContent: { select: { title: true } },
            updates: { select: { screenshotUrl: true } },
            dayProgress: { select: { screenshotUrls: true } },
          },
        },
      },
      orderBy: { completedAt: "asc" },
      take: fetchSize,
    }),
    prisma.jokiHistoryEntry.findMany({
      where: {
        ...(gameSlugParam ? { game: { slug: gameSlugParam as GameSlug } } : {}),
        ...(sinceDate ? { completedAt: { gt: sinceDate } } : {}),
      },
      select: {
        id: true,
        title: true,
        jokerName: true,
        completedAt: true,
        screenshotUrls: true,
        customer: { select: { name: true, publicSlug: true } },
        game: { select: { slug: true, name: true } },
      },
      orderBy: { completedAt: "asc" },
      take: fetchSize,
    }),
  ]);

  const fromOrders: HistoryEntry[] = orders
    .filter((o) => o.completedAt !== null)
    .map((o) => ({
      id: `order:${o.id}`,
      source: "order" as const,
      orderCode: o.orderCode,
      gameSlug: o.game.slug,
      gameName: o.game.name,
      customerName: o.customer.name,
      jokerName: o.worker?.name ?? o.jokerName ?? null,
      completedAt: (o.completedAt ?? o.updatedAt).toISOString(),
      publicUrl: `${siteOrigin}/progress/${o.customer.publicSlug}`,
      lines: o.lines.map((line) => {
        const isRawatAkun = line.jokiItem?.category.isRawatAkun ?? false;
        const title =
          (line.jokiItem?.title ??
            line.jokiPaket?.title ??
            line.patchEvent?.title ??
            line.endgameContent?.title ??
            "Item tidak dikenal") + (line.characterName ? ` — ${line.characterName}` : "");

        const updateShots = line.updates
          .map((u) => u.screenshotUrl)
          .filter((u): u is string => Boolean(u));
        // Rawat Akun: screenshot tersebar di banyak OrderLineDayProgress
        // (satu per hari), bukan di updates -- digabung jadi satu daftar.
        const dayShots = isRawatAkun ? line.dayProgress.flatMap((d) => d.screenshotUrls) : [];

        return { title, isRawatAkun, screenshotUrls: [...updateShots, ...dayShots] };
      }),
    }));

  const fromManual: HistoryEntry[] = historyEntries.map((entry) => ({
    id: `manual:${entry.id}`,
    source: "manual" as const,
    orderCode: null,
    gameSlug: entry.game.slug,
    gameName: entry.game.name,
    customerName: entry.customer.name,
    jokerName: entry.jokerName,
    completedAt: entry.completedAt.toISOString(),
    publicUrl: entry.customer.publicSlug ? `${siteOrigin}/progress/${entry.customer.publicSlug}` : null,
    lines: [{ title: entry.title, isRawatAkun: false, screenshotUrls: entry.screenshotUrls }],
  }));

  const merged = [...fromOrders, ...fromManual]
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
    .slice(0, limit);

  const nextCursor = merged.length > 0 ? merged[merged.length - 1].completedAt : null;

  return NextResponse.json({ results: merged, nextCursor });
}
