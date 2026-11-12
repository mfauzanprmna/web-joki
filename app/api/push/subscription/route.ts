import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/session-token";

interface SubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return (await verifySessionToken(cookieStore.get("shihu_admin_session")?.value)) === "admin";
}

function isAllowedPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    return host === "fcm.googleapis.com"
      || host.endsWith(".push.services.mozilla.com")
      || host === "push.services.mozilla.com"
      || host.endsWith(".push.apple.com")
      || host === "web.push.apple.com"
      || host.endsWith(".notify.windows.com");
  } catch {
    return false;
  }
}

function parseSubscription(value: unknown): SubscriptionPayload | null {
  if (!value || typeof value !== "object") return null;
  const payload = value as Record<string, unknown>;
  const keys = payload.keys;
  if (typeof payload.endpoint !== "string" || payload.endpoint.length > 2048) return null;
  if (!isAllowedPushEndpoint(payload.endpoint) || !keys || typeof keys !== "object") return null;

  const subscriptionKeys = keys as Record<string, unknown>;
  if (
    typeof subscriptionKeys.p256dh !== "string"
    || !/^[A-Za-z0-9_-]{20,256}$/.test(subscriptionKeys.p256dh)
    || typeof subscriptionKeys.auth !== "string"
    || !/^[A-Za-z0-9_-]{8,128}$/.test(subscriptionKeys.auth)
  ) return null;

  return {
    endpoint: payload.endpoint,
    keys: { p256dh: subscriptionKeys.p256dh, auth: subscriptionKeys.auth },
  };
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  }

  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return NextResponse.json({ error: "Data langganan tidak valid." }, { status: 400 });
  }

  const subscription = parseSubscription(value);
  if (!subscription) {
    return NextResponse.json({ error: "Data langganan push tidak valid." }, { status: 400 });
  }

  await prisma.adminPushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    update: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Sesi admin tidak valid." }, { status: 401 });
  }

  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return NextResponse.json({ error: "Data langganan tidak valid." }, { status: 400 });
  }

  if (!value || typeof value !== "object" || typeof (value as Record<string, unknown>).endpoint !== "string") {
    return NextResponse.json({ error: "Endpoint langganan tidak valid." }, { status: 400 });
  }
  const endpoint = (value as { endpoint: string }).endpoint;
  if (endpoint.length > 2048 || !isAllowedPushEndpoint(endpoint)) {
    return NextResponse.json({ error: "Endpoint langganan tidak valid." }, { status: 400 });
  }

  await prisma.adminPushSubscription.deleteMany({ where: { endpoint } });
  return NextResponse.json({ ok: true });
}
