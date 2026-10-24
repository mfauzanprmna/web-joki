import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session-token";

const ADMIN_COOKIE = "shihu_admin_session";
const WORKER_COOKIE = "shihu_worker_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const session = request.cookies.get(ADMIN_COOKIE);
    if ((await verifySessionToken(session?.value)) !== "admin") {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname === "/worker/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/worker")) {
    const session = request.cookies.get(WORKER_COOKIE);
    const subject = await verifySessionToken(session?.value);
    if (!subject || subject === "admin") {
      const loginUrl = new URL("/worker/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/worker/:path*"],
};