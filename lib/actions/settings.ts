"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CONTACT_ICON_KEYS } from "@/lib/contact-icons";

export interface SettingActionState {
  error?: string;
  success?: boolean;
}

// ---------------------------------------------------------------------------
// Validasi
// ---------------------------------------------------------------------------

/** Link tujuan kontak: cuma http(s) atau mailto. Skema lain (terutama
 * `javascript:`) ditolak karena nilainya langsung dipakai sebagai href di
 * footer yang tampil ke semua pengunjung. */
function isValidContactUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return ["http:", "https:", "mailto:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/** Logo kustom: URL gambar http(s), atau path dalam situs ("/logo.png"). */
function isValidLogoUrl(value: string): boolean {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

interface ParsedContactFields {
  icon: string;
  logoUrl: string | null;
  name: string;
  url: string;
}

function parseContactFields(formData: FormData): { error: string } | { data: ParsedContactFields } {
  const name = String(formData.get("name") || "").trim();
  const icon = String(formData.get("icon") || "").trim();
  const url = String(formData.get("url") || "").trim();
  const logoUrl = String(formData.get("logoUrl") || "").trim();

  if (!name) return { error: "Nama wajib diisi." };
  if (name.length > 40) return { error: "Nama maksimal 40 karakter." };
  if (!CONTACT_ICON_KEYS.includes(icon)) return { error: "Ikon tidak valid, pilih dari daftar." };
  if (!url) return { error: "Link wajib diisi." };
  if (url.length > 500) return { error: "Link terlalu panjang (maksimal 500 karakter)." };
  if (!isValidContactUrl(url)) {
    return { error: "Link harus diawali https:// (atau http:// / mailto:), mis. https://discord.gg/xxxx" };
  }
  if (logoUrl && !isValidLogoUrl(logoUrl)) {
    return { error: "URL logo kustom harus diawali https:// atau berupa path seperti /logo.png." };
  }

  return { data: { icon, logoUrl: logoUrl || null, name, url } };
}

/** Footer tampil di semua halaman customer, jadi seluruh layout di-revalidate
 * (bukan cuma satu path) setiap kali kontak berubah. */
function revalidateContactPages() {
  revalidatePath("/admin/setting");
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Kontak
// ---------------------------------------------------------------------------

export async function createContactLink(
  _prevState: SettingActionState | undefined,
  formData: FormData,
): Promise<SettingActionState> {
  const parsed = parseContactFields(formData);
  if ("error" in parsed) return { error: parsed.error };

  // Link baru ditaruh paling akhir.
  const last = await prisma.contactLink.findFirst({
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.contactLink.create({
    data: { ...parsed.data, position: (last?.position ?? 0) + 1 },
  });

  revalidateContactPages();
  return { success: true };
}

export async function updateContactLink(
  _prevState: SettingActionState | undefined,
  formData: FormData,
): Promise<SettingActionState> {
  const id = String(formData.get("id") || "").trim();
  if (!id) return { error: "Kontak tidak ditemukan." };

  const parsed = parseContactFields(formData);
  if ("error" in parsed) return { error: parsed.error };

  const positionRaw = String(formData.get("position") || "").trim();
  const position = Number(positionRaw);
  if (!positionRaw || !Number.isInteger(position) || position < 0) {
    return { error: "Urutan harus berupa angka bulat 0 atau lebih." };
  }

  // updateMany (bukan update) supaya tidak melempar error kalau kontaknya
  // sudah keburu dihapus dari tab/perangkat lain.
  const result = await prisma.contactLink.updateMany({
    where: { id },
    data: { ...parsed.data, position },
  });
  if (result.count === 0) return { error: "Kontak tidak ditemukan (mungkin sudah dihapus)." };

  revalidateContactPages();
  return { success: true };
}

export async function deleteContactLink(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  if (!id) return;

  await prisma.contactLink.deleteMany({ where: { id } });

  revalidateContactPages();
}

// ---------------------------------------------------------------------------
// Komisi worker
// ---------------------------------------------------------------------------

export async function updateWorkerCommission(
  _prevState: SettingActionState | undefined,
  formData: FormData,
): Promise<SettingActionState> {
  const raw = String(formData.get("percent") || "").trim();
  const percent = Number(raw);

  if (!raw || !Number.isInteger(percent) || percent < 0 || percent > 100) {
    return { error: "Persentase harus berupa angka bulat antara 0 sampai 100." };
  }

  await prisma.appSetting.upsert({
    where: { id: "singleton" },
    update: { workerCommissionPercent: percent },
    create: { id: "singleton", workerCommissionPercent: percent },
  });

  revalidatePath("/admin/setting");
  revalidatePath("/admin/antrian");
  revalidatePath("/admin/worker");
  revalidatePath("/worker", "layout");
  return { success: true };
}
