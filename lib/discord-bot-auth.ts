import { NextRequest, NextResponse } from "next/server";

/**
 * Validasi header "x-bot-secret" yang wajib disertakan bot Discord di setiap
 * request ke API ini. Secret-nya HARUS SAMA PERSIS dengan WEB_API_SECRET di
 * .env bot (lihat discord-bot/.env.example).
 *
 * Return NextResponse (401) kalau tidak valid -- caller cukup:
 *   const unauthorized = requireBotSecret(req);
 *   if (unauthorized) return unauthorized;
 */
export function requireBotSecret(req: NextRequest): NextResponse | null {
  const expected = process.env.DISCORD_BOT_SECRET;
  if (!expected) {
    // Kalau admin belum set secret-nya di .env, tutup akses sama sekali
    // daripada diam-diam membiarkan endpoint terbuka tanpa proteksi.
    return NextResponse.json(
      { error: "DISCORD_BOT_SECRET belum dikonfigurasi di server." },
      { status: 503 },
    );
  }

  const provided = req.headers.get("x-bot-secret");
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
