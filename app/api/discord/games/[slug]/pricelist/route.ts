import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBotSecret } from "@/lib/discord-bot-auth";

/**
 * GET /api/discord/games/:slug/pricelist
 *
 * Dipanggil bot Discord (/setup dan /sync-harga) untuk mengambil daftar
 * harga terbaru satu game, dikelompokkan per kategori, supaya bisa
 * ditampilkan sebagai tabel di channel game terkait.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const unauthorized = requireBotSecret(req);
  if (unauthorized) return unauthorized;

  const { slug } = await params;

  const game = await prisma.game.findUnique({
    where: { slug: slug as "genshin" | "wuwa" | "neverness" },
  });

  if (!game) {
    return NextResponse.json({ error: "Game tidak ditemukan." }, { status: 404 });
  }

  const categories = await prisma.jokiCategory.findMany({
    where: { gameId: game.id, isActive: true },
    orderBy: { createdAt: "asc" },
    include: {
      jokiItems: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        select: {
          title: true,
          priceRupiah: true,
          etaLabel: true,
          badge: true,
          unitQuantity: true,
        },
      },
    },
  });

  const pakets = await prisma.jokiPaket.findMany({
    where: { gameId: game.id, isActive: true },
    orderBy: { createdAt: "asc" },
    select: { title: true, priceRupiah: true, description: true },
  });

  return NextResponse.json({
    gameName: game.name,
    gameSlug: game.slug,
    updatedAt: new Date().toISOString(),
    categories: categories
      .filter((c) => c.jokiItems.length > 0)
      .map((c) => ({
        name: c.name,
        items: c.jokiItems.map((item) => ({
          title: item.title,
          priceRupiah: item.priceRupiah,
          etaLabel: item.etaLabel,
          badge: item.badge,
          unitQuantity: item.unitQuantity,
        })),
      })),
    pakets: pakets.map((p) => ({
      title: p.title,
      priceRupiah: p.priceRupiah,
      description: p.description,
    })),
  });
}
