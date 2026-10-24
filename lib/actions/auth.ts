"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, isSessionSecretConfigured } from "@/lib/session-token";

const ADMIN_COOKIE = "shihu_admin_session";

export async function loginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const password = formData.get("password");
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return { error: "ADMIN_PASSWORD belum diset di environment server." };
  }

  if (!isSessionSecretConfigured()) {
    return { error: "SESSION_SECRET wajib diisi minimal 32 byte di environment server." };
  }

  if (typeof password !== "string" || password.length > 1024 || password !== expected) {
    return { error: "Password salah. Coba lagi." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, await createSessionToken("admin", 60 * 60 * 8), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 jam
  });

  redirect("/admin");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}
