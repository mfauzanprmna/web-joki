import { prisma } from "@/lib/prisma";
import { createCustomer } from "@/lib/actions/customer";
import { CustomerRowItem } from "@/components/admin/CustomerRowItem";

export default async function AdminCustomerPage() {
  const customers = await prisma.customer.findMany({
    include: {
      orders: {
        select: {
          id: true,
          orderCode: true,
          status: true,
          totalPrice: true,
          game: { select: { name: true, accentColor: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-1">Customer</h1>
      <p className="text-shihu-muted text-sm mb-6">
        Data customer dan riwayat seluruh order miliknya (bisa lintas akun/game). Customer baru juga otomatis dibuat saat mengisi nama baru di form pesanan.
      </p>

      <details className="bg-shihu-card border border-shihu-border rounded-2xl p-5 mb-7 group">
        <summary className="font-display text-sm font-semibold cursor-pointer list-none flex items-center justify-between">
          Tambah customer baru
          <span className="text-shihu-corona text-xs group-open:rotate-45 transition-transform">
            +
          </span>
        </summary>

        <form action={createCustomer} className="flex flex-col gap-3 mt-4">
          <div>
            <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
              Nama customer
            </label>
            <input name="name" required className="admin-input" placeholder="Rafi A." />
          </div>

          <div>
            <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
              Catatan (opsional)
            </label>
            <textarea name="notes" rows={2} className="admin-input" placeholder="Pelanggan lama, sering order Genshin" />
          </div>

          <button
            type="submit"
            className="self-start px-5 py-2.5 rounded-xl font-display font-semibold text-sm text-[#1A1206] bg-corona mt-1"
          >
            Tambah customer
          </button>
        </form>
      </details>

      <div className="flex flex-col gap-2.5">
        {customers.map((c) => (
          <CustomerRowItem key={c.id} customer={c} />
        ))}
      </div>
    </div>
  );
}
