import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBotSecret } from "@/lib/discord-bot-auth";
import { buildOrderTitle } from "@/lib/order-display";

const STATUS_LABEL: Record<string, string> = {
  MENUNGGU: "Menunggu giliran",
  DIKERJAKAN: "Sedang dikerjakan",
  FINISHING: "Finishing",
  SELESAI: "Selesai",
  DIBATALKAN: "Dibatalkan",
};

/**
 * GET /api/discord/orders/search?q=...
 *
 * Dipanggil bot Discord (command /cek-antrian) untuk mencari order
 * berdasarkan kode pesanan ATAU nama customer (cocok sebagian, tidak
 * case-sensitive) -- pola pencarian yang sama seperti yang dipakai di
 * halaman /antrian pada web (lihat components/AntrianListFilter.tsx).
 *
 * Dibatasi 10 hasil supaya respons Discord embed tidak kepanjangan.
 */
export async function GET(req: NextRequest) {
  const unauthorized = requireBotSecret(req);
  if (unauthorized) return unauthorized;

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Parameter q wajib diisi." }, { status: 400 });
  }

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { orderCode: { contains: q, mode: "insensitive" } },
        { customer: { name: { contains: q, mode: "insensitive" } } },
      ],
    },
    include: {
      game: true,
      customer: true,
      lines: { include: { jokiItem: true, jokiPaket: true, patchEvent: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    results: orders.map((order) => ({
      orderCode: order.orderCode,
      customerName: order.customer.name,
      gameName: order.game.name,
      layanan: buildOrderTitle(order.lines),
      status: order.status,
      statusLabel: STATUS_LABEL[order.status] ?? order.status,
      progressPct: order.progressPct,
      jokerName: order.jokerName,
      publicSlug: order.customer.publicSlug,
    })),
  });
}
