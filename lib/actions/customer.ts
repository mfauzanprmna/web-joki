"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateCustomerSlug } from "@/lib/customer-slug";

/**
 * Generate publicSlug yang dijamin belum dipakai Customer lain (retry jika
 * ada collision, meski secara statistik sangat jarang terjadi).
 */
export async function createUniqueCustomerSlug(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateCustomerSlug();
    const existing = await prisma.customer.findUnique({ where: { publicSlug: slug } });
    if (!existing) return slug;
  }
  // Fallback super jarang terjadi: perpanjang slug supaya makin kecil peluang collision.
  return generateCustomerSlug(16);
}

export async function createCustomer(formData: FormData) {
  const name = String(formData.get("name"));
  const notes = String(formData.get("notes") || "").trim();
  const publicSlug = await createUniqueCustomerSlug();

  await prisma.customer.create({
    data: { name, notes: notes || null, publicSlug },
  });

  revalidatePath("/admin/customer");
  revalidatePath("/admin/antrian");
}

export async function updateCustomer(formData: FormData) {
  const id = String(formData.get("id"));
  const name = String(formData.get("name"));
  const notes = String(formData.get("notes") || "").trim();

  await prisma.customer.update({
    where: { id },
    data: { name, notes: notes || null },
  });

  revalidatePath("/admin/customer");
  revalidatePath("/admin/antrian");
}

export async function deleteCustomer(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.customer.delete({ where: { id } });

  revalidatePath("/admin/customer");
  revalidatePath("/admin/antrian");
}
