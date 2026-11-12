import { sendNotification, setVapidDetails } from "web-push";
import { prisma } from "@/lib/prisma";
import { isoDay } from "@/lib/rawat-akun-schedule";
import type { OrderNotification } from "@/lib/order-notifications";

interface PushPayload {
  title: string;
  body: string;
  url: string;
}

function getVapidConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, dan VAPID_SUBJECT wajib dikonfigurasi untuk push.");
  }
  return { publicKey, privateKey, subject };
}

export async function sendAdminDeadlinePushes(notifications: OrderNotification[]) {
  const reminders = notifications.filter((notification) => notification.daysUntil === 3);
  if (reminders.length === 0) return { delivered: 0, failed: 0, subscriptions: 0, reminders: 0 };

  const subscriptions = await prisma.adminPushSubscription.findMany();
  if (subscriptions.length === 0) return { delivered: 0, failed: 0, subscriptions: 0, reminders: reminders.length };

  const vapid = getVapidConfig();
  setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  let delivered = 0;
  let failed = 0;
  for (const notification of reminders) {
    const notificationKey = `${notification.id}:${isoDay(notification.dueDate)}`;
    const existing = await prisma.devicePushDelivery.findMany({
      where: { notificationKey, subscriptionId: { in: subscriptions.map(({ id }) => id) } },
      select: { subscriptionId: true },
    });
    const alreadyDelivered = new Set(existing.map(({ subscriptionId }) => subscriptionId));

    const payload: PushPayload = {
      title: `${notification.orderCode} · ${notification.title}`,
      body: notification.detail,
      url: `/admin/progress/${notification.orderId}`,
    };

    for (const subscription of subscriptions) {
      if (alreadyDelivered.has(subscription.id)) continue;

      try {
        await sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify(payload),
        );
        await prisma.devicePushDelivery.create({
          data: { subscriptionId: subscription.id, notificationKey },
        });
        delivered++;
      } catch (error) {
        const statusCode = typeof error === "object" && error !== null && "statusCode" in error
          ? error.statusCode
          : undefined;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.adminPushSubscription.delete({ where: { id: subscription.id } });
          console.info("Menghapus langganan push admin yang sudah tidak berlaku.");
          continue;
        }

        failed++;
        console.error("Gagal mengirim notifikasi push admin:", error);
      }
    }
  }

  return { delivered, failed, subscriptions: subscriptions.length, reminders: reminders.length };
}
