import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getOrderNotifications } from "@/lib/order-notifications";
import { sendAdminDeadlinePushes } from "@/lib/admin-push-notifications";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 32) {
    return NextResponse.json({ error: "CRON_SECRET belum dikonfigurasi dengan aman." }, { status: 503 });
  }

  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const expectedBuffer = Buffer.from(secret);
  const providedBuffer = Buffer.from(provided);
  if (expectedBuffer.length !== providedBuffer.length || !timingSafeEqual(expectedBuffer, providedBuffer)) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  try {
    const notifications = await getOrderNotifications();
    const result = await sendAdminDeadlinePushes(notifications);
    if (result.failed > 0) {
      return NextResponse.json(result, { status: 502 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Gagal menjalankan pengiriman notifikasi push terjadwal:", error);
    return NextResponse.json({ error: "Pengiriman notifikasi gagal." }, { status: 500 });
  }
}
