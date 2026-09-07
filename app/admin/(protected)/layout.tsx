import Link from "next/link";
import { ShihuMark } from "@/components/ShihuMark";
import { logoutAction } from "@/lib/actions/auth";

const NAV_GROUPS = [
  {
    label: null,
    items: [{ href: "/admin", label: "Dashboard" }],
  },
  {
    label: "Data master",
    items: [
      { href: "/admin/game", label: "Game" },
      { href: "/admin/kategori", label: "Kategori joki" },
      { href: "/admin/region", label: "Region" },
      { href: "/admin/quest", label: "Jenis quest" },
      { href: "/admin/patch", label: "Patch" },
      { href: "/admin/endgame", label: "Konten endgame" },
    ],
  },
  {
    label: "Operasional",
    items: [
      { href: "/admin/customer", label: "Customer" },
      { href: "/admin/joki", label: "Joki item" },
      { href: "/admin/paket", label: "Paket joki" },
      { href: "/admin/antrian", label: "Pesanan" },
      { href: "/admin/history-joki", label: "History joki" },
      { href: "/admin/testimoni", label: "Testimoni" },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-shihu-bg flex">
      <aside className="w-60 shrink-0 border-r border-shihu-border bg-shihu-card/40 hidden md:flex flex-col">
        <div className="p-5 flex items-center gap-2.5 border-b border-shihu-border">
          <ShihuMark size={26} />
          <div>
            <p className="font-display font-bold text-sm leading-tight">Shihu Service</p>
            <p className="text-shihu-faint text-[11px]">Admin panel</p>
          </div>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-4 overflow-y-auto">
          {NAV_GROUPS.map((group, i) => (
            <div key={i}>
              {group.label && (
                <p className="px-3.5 mb-1 text-[10.5px] font-display font-semibold uppercase tracking-wide text-shihu-faint">
                  {group.label}
                </p>
              )}
              <div className="flex flex-col gap-1">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-3.5 py-2.5 rounded-xl font-display text-sm font-medium text-shihu-muted hover:text-shihu-text hover:bg-[#2C2540] transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-shihu-border">
          <Link
            href="/"
            className="block px-3.5 py-2 text-shihu-faint text-xs mb-1 hover:text-shihu-muted"
          >
            ← Lihat situs customer
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full text-left px-3.5 py-2 rounded-xl text-sm text-red-400 hover:bg-red-400/10 transition-colors font-display font-medium"
            >
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-shihu-border">
          <div className="flex items-center gap-2">
            <ShihuMark size={24} />
            <span className="font-display font-bold text-sm">Admin</span>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="text-red-400 text-xs font-display font-medium">
              Keluar
            </button>
          </form>
        </header>
        <main className="p-6 md:p-8 max-w-5xl">{children}</main>
      </div>
    </div>
  );
}
