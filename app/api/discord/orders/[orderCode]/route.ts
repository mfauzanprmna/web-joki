import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBotSecret } from "@/lib/discord-bot-auth";
import { buildOrderTitle } from "@/lib/order-display";

/**
 * GET /api/discord/orders/:orderCode
 *
 * Dipanggil bot Discord (command /ticket-info) untuk menampilkan data order
 * terbaru langsung dari database, supaya info yang ditampilkan di Discord
 * tidak pernah basi walau ticket-nya sudah lama dibuat.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderCode: string }> },
) {
  const unauthorized = requireBotSecret(req);
  if (unauthorized) return unauthorized;

  const { orderCode } = await params;

  const order = await prisma.order.findUnique({
    where: { orderCode },
    include: {
      game: true,
      customer: true,
      lines: { include: { jokiItem: true, jokiPaket: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({
    orderCode: order.orderCode,
    customerName: order.customer.name,
    gameName: order.game.name,
    layanan: buildOrderTitle(order.lines),
    status: order.status,
    progressPct: order.progressPct,
    totalPrice: order.totalPrice,
    createdAt: order.createdAt.toISOString(),
    jokerName: order.jokerName,
    publicSlug: order.customer.publicSlug,
  });
}
