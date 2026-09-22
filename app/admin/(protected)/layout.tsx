import Link from "next/link";
import { ShihuMark } from "@/components/ShihuMark";
import { logoutAction } from "@/lib/actions/auth";
import {
  FaGaugeHigh,
  FaChartLine,
  FaGamepad,
  FaLayerGroup,
  FaMapLocationDot,
  FaListOl,
  FaCodeBranch,
  FaDungeon,
  FaUsers,
  FaBoxOpen,
  FaBoxesStacked,
  FaClipboardList,
  FaUserTie,
  FaClockRotateLeft,
  FaStar,
  FaArrowLeft,
  FaRightFromBracket,
} from "react-icons/fa6";
import type { IconType } from "react-icons";

const NAV_GROUPS: { label: string | null; items: { href: string; label: string; icon: IconType }[] }[] = [
  {
    label: null,
    items: [
      { href: "/admin", label: "Dashboard", icon: FaGaugeHigh },
      { href: "/admin/analitik", label: "Analitik", icon: FaChartLine },
    ],
  },
  {
    label: "Data master",
    items: [
      { href: "/admin/game", label: "Game", icon: FaGamepad },
      { href: "/admin/kategori", label: "Kategori joki", icon: FaLayerGroup },
      { href: "/admin/region", label: "Region", icon: FaMapLocationDot },
      { href: "/admin/quest", label: "Jenis quest", icon: FaListOl },
      { href: "/admin/patch", label: "Patch", icon: FaCodeBranch },
      { href: "/admin/endgame", label: "Konten endgame", icon: FaDungeon },
    ],
  },
  {
    label: "Operasional",
    items: [
      { href: "/admin/customer", label: "Customer", icon: FaUsers },
      { href: "/admin/joki", label: "Joki item", icon: FaBoxOpen },
      { href: "/admin/paket", label: "Paket joki", icon: FaBoxesStacked },
      { href: "/admin/antrian", label: "Pesanan", icon: FaClipboardList },
      { href: "/admin/worker", label: "Akun worker", icon: FaUserTie },
      { href: "/admin/history-joki", label: "History joki", icon: FaClockRotateLeft },
      { href: "/admin/testimoni", label: "Testimoni", icon: FaStar },
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
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-display text-sm font-medium text-shihu-muted hover:text-shihu-text hover:bg-[#2C2540] transition-colors"
                    >
                      <Icon className="text-[13px] shrink-0" aria-hidden="true" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-shihu-border">
          <Link
            href="/"
            className="flex items-center gap-2 px-3.5 py-2 text-shihu-faint text-xs mb-1 hover:text-shihu-muted"
          >
            <FaArrowLeft className="text-[10px]" aria-hidden="true" />
            Lihat situs customer
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 text-left px-3.5 py-2 rounded-xl text-sm text-red-400 hover:bg-red-400/10 transition-colors font-display font-medium"
            >
              <FaRightFromBracket className="text-[13px]" aria-hidden="true" />
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
            <button type="submit" className="flex items-center gap-1.5 text-red-400 text-xs font-display font-medium">
              <FaRightFromBracket className="text-[11px]" aria-hidden="true" />
              Keluar
            </button>
          </form>
        </header>
        <main className="site-container py-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
