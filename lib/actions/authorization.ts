import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/session-token";

const ADMIN_COOKIE = "shihu_admin_session";
const WORKER_COOKIE = "shihu_worker_session";

export async function requireAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const subject = await verifySessionToken(cookieStore.get(ADMIN_COOKIE)?.value);
  if (subject !== "admin") redirect("/admin/login");
}

export async function requireOrderLineAccess(orderLineId: string): Promise<void> {
  const cookieStore = await cookies();
  const adminSubject = await verifySessionToken(cookieStore.get(ADMIN_COOKIE)?.value);
  if (adminSubject === "admin") return;

  const workerId = await verifySessionToken(cookieStore.get(WORKER_COOKIE)?.value);
  if (!workerId || workerId === "admin") redirect("/worker/login");

  const worker = await prisma.worker.findUnique({
    where: { id: workerId },
    select: { isActive: true },
  });
  if (!worker?.isActive) redirect("/worker/login");

  const assignedLine = await prisma.orderLine.findFirst({
    where: { id: orderLineId, order: { workerId } },
    select: { id: true },
  });
  if (!assignedLine) notFound();
}

export async function requireDayTaskAccess(taskId: string): Promise<string> {
  const task = await prisma.orderLineDayTask.findUnique({
    where: { id: taskId },
    select: { orderLineId: true },
  });
  if (!task) notFound();

  await requireOrderLineAccess(task.orderLineId);
  return task.orderLineId;
}
