import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBotSecret } from "@/lib/discord-bot-auth";

/**
 * POST /api/discord/testimonials
 *
 * Dipanggil bot Discord saat customer mengirim testimoni di channel
 * #testimoni. Selalu masuk sebagai isPublished=false -- sama seperti
 * testimoni dari web (lihat submitCustomerTestimonial di
 * lib/actions/testimonial.ts) -- supaya tetap ada gerbang moderasi admin
 * sebelum tayang publik, walau sumbernya dari Discord.
 *
 * Tidak terikat ke Order/JokiHistoryEntry manapun (orderId & jokiHistoryEntryId
 * null) karena testimoni Discord murni chat bebas, bukan alur order.
 */
export async function POST(req: NextRequest) {
  const unauthorized = requireBotSecret(req);
  if (unauthorized) return unauthorized;

  const body = (await req.json().catch(() => null)) as {
    gameSlug?: string;
    customerName?: string;
    rating?: number;
    message?: string;
    discordMessageUrl?: string;
  } | null;

  if (!body?.gameSlug || !body.customerName || !body.message) {
    return NextResponse.json(
      { error: "gameSlug, customerName, dan message wajib diisi." },
      { status: 400 },
    );
  }

  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "rating harus bilangan 1-5." }, { status: 400 });
  }

  const game = await prisma.game.findUnique({
    where: { slug: body.gameSlug as "genshin" | "wuwa" | "neverness" },
    select: { id: true },
  });
  if (!game) {
    return NextResponse.json({ error: "Game tidak ditemukan." }, { status: 404 });
  }

  const created = await prisma.testimonial.create({
    data: {
      gameId: game.id,
      customerName: body.customerName.slice(0, 200),
      rating,
      message: body.discordMessageUrl
        ? `${body.message}\n\n(via Discord: ${body.discordMessageUrl})`
        : body.message,
      isPublished: false,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: created.id });
}

/**
 * GET /api/discord/testimonials
 *
 * Dipanggil bot Discord (/sync-data) untuk mengambil testimoni yang SUDAH
 * di-approve admin (isPublished=true), supaya bisa di-post ke channel
 * #testimoni. Dibatasi 20 testimoni terbaru.
 */
export async function GET(req: NextRequest) {
  const unauthorized = requireBotSecret(req);
  if (unauthorized) return unauthorized;

  const testimonials = await prisma.testimonial.findMany({
    where: { isPublished: true },
    include: { game: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    results: testimonials.map((t) => ({
      id: t.id,
      gameName: t.game.name,
      customerName: t.customerName,
      rating: t.rating,
      message: t.message,
      createdAt: t.createdAt.toISOString(),
    })),
  });
}
