import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [
    activeOrders,
    totalGames,
    totalCategories,
    totalRegions,
    totalQuestTypes,
    totalPatches,
    totalEndgameContent,
    totalItems,
    totalPakets,
    totalCustomers,
    totalTestimonials,
    completedOrders,
  ] = await Promise.all([
    prisma.order.count({
      where: { status: { in: ["MENUNGGU", "DIKERJAKAN", "FINISHING"] } },
    }),
    prisma.game.count(),
    prisma.jokiCategory.count({ where: { isActive: true } }),
    prisma.gameRegion.count({ where: { isActive: true } }),
    prisma.questType.count({ where: { isActive: true } }),
    prisma.patch.count(),
    prisma.endgameContent.count({ where: { isActive: true } }),
    prisma.jokiItem.count({ where: { isActive: true } }),
    prisma.jokiPaket.count({ where: { isActive: true } }),
    prisma.customer.count(),
    prisma.testimonial.count(),
    prisma.order.count({ where: { status: "SELESAI" } }),
  ]);

  const stats = [
    { label: "Antrian aktif", value: activeOrders, href: "/admin/antrian" },
    { label: "Customer", value: totalCustomers, href: "/admin/customer" },
    { label: "Joki item aktif", value: totalItems, href: "/admin/joki" },
    { label: "Paket aktif", value: totalPakets, href: "/admin/paket" },
    { label: "Pesanan selesai", value: completedOrders, href: "/admin/antrian" },
    { label: "Total testimoni", value: totalTestimonials, href: "/admin/testimoni" },
  ];

  const masterData = [
    { label: "Game", value: totalGames, href: "/admin/game", desc: "Data game yang tersedia" },
    { label: "Kategori joki", value: totalCategories, href: "/admin/kategori", desc: "Kategori per game" },
    { label: "Region", value: totalRegions, href: "/admin/region", desc: "Wilayah per game" },
    { label: "Jenis quest", value: totalQuestTypes, href: "/admin/quest", desc: "Jenis quest per game" },
    { label: "Patch", value: totalPatches, href: "/admin/patch", desc: "Patch & event per game" },
    { label: "Konten endgame", value: totalEndgameContent, href: "/admin/endgame", desc: "Konten siklus reset" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-shihu-muted text-sm mb-7">
        Ringkasan aktivitas Shihu Service.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mb-8">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-shihu-card border border-shihu-border rounded-2xl p-5 hover:border-shihu-borderSoft transition-colors"
          >
            <p className="font-display text-3xl font-bold text-shihu-corona mb-1">
              {s.value}
            </p>
            <p className="text-shihu-muted text-sm">{s.label}</p>
          </Link>
        ))}
      </div>

      <p className="font-display text-sm font-semibold text-shihu-muted mb-3">
        Data master (pondasi Joki Item)
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {masterData.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            className="bg-shihu-card border border-shihu-border rounded-2xl p-4 hover:border-shihu-corona/50 transition-colors"
          >
            <p className="font-display text-2xl font-bold mb-1">{m.value}</p>
            <p className="text-shihu-text text-[13px] font-medium font-display">{m.label}</p>
            <p className="text-shihu-faint text-[11px] mt-0.5">{m.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Link
          href="/admin/antrian"
          className="bg-shihu-card border border-shihu-border rounded-2xl p-4 text-sm font-display font-medium hover:border-shihu-corona/50 transition-colors"
        >
          + Buat pesanan baru
        </Link>
        <Link
          href="/admin/customer"
          className="bg-shihu-card border border-shihu-border rounded-2xl p-4 text-sm font-display font-medium hover:border-shihu-corona/50 transition-colors"
        >
          + Tambah customer
        </Link>
        <Link
          href="/admin/joki"
          className="bg-shihu-card border border-shihu-border rounded-2xl p-4 text-sm font-display font-medium hover:border-shihu-corona/50 transition-colors"
        >
          + Tambah joki item
        </Link>
        <Link
          href="/admin/paket"
          className="bg-shihu-card border border-shihu-border rounded-2xl p-4 text-sm font-display font-medium hover:border-shihu-corona/50 transition-colors"
        >
          + Tambah paket joki
        </Link>
      </div>
    </div>
  );
}
