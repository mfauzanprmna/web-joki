import { prisma } from "@/lib/prisma";
import { DEFAULT_WORKER_COMMISSION_PERCENT } from "@/lib/commission";

/**
 * Pengaturan global yang dikelola admin lewat /admin/setting. File ini
 * mengakses database, jadi HANYA boleh diimpor dari server component /
 * server action -- jangan dari komponen "use client" (oper hasilnya
 * sebagai prop).
 */

/** Persentase komisi worker (0-100). Fallback ke default kalau baris
 * pengaturan belum pernah dibuat. */
export async function getWorkerCommissionPercent(): Promise<number> {
  const setting = await prisma.appSetting.findUnique({
    where: { id: "singleton" },
    select: { workerCommissionPercent: true },
  });
  return setting?.workerCommissionPercent ?? DEFAULT_WORKER_COMMISSION_PERCENT;
}

export interface ContactLinkData {
  id: string;
  icon: string;
  logoUrl: string | null;
  name: string;
  url: string;
  position: number;
}

/** Semua link kontak, urut sesuai `position`. */
export async function getContactLinks(): Promise<ContactLinkData[]> {
  return prisma.contactLink.findMany({
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true, icon: true, logoUrl: true, name: true, url: true, position: true },
  });
}
