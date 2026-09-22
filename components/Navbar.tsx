"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ShihuMark } from "./ShihuMark";
import { FaHouse, FaListCheck, FaClockRotateLeft, FaStar } from "react-icons/fa6";
import type { IconType } from "react-icons";

const NAV_ITEMS: { href: string; label: string; icon: IconType }[] = [
  { href: "/", label: "Beranda", icon: FaHouse },
  { href: "/antrian", label: "Antrian", icon: FaListCheck },
  { href: "/history", label: "History", icon: FaClockRotateLeft },
  { href: "/testimoni", label: "Testimoni", icon: FaStar },
];

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function renderNavItems(mobile = false) {
    return NAV_ITEMS.map((item) => {
      const active = pathname === item.href;
      const Icon = item.icon;
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMenuOpen(false)}
          className={`${mobile ? "flex items-center gap-2.5 w-full px-3.5 py-3" : "flex items-center gap-1.5 px-3.5 py-2"} rounded-[10px] font-display text-sm font-medium transition-colors ${active
            ? "bg-shihu-corona/15 text-shihu-corona"
            : "text-shihu-muted hover:text-shihu-text hover:bg-white/5"
            }`}
        >
          <Icon className={mobile ? "text-base" : "text-[13px]"} aria-hidden="true" />
          {item.label}
        </Link>
      );
    });
  }

  return (
    <header className="sticky top-0 z-40 bg-shihu-bg/85 backdrop-blur-md border-b border-shihu-border">
      <div className="site-container py-3.5 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5">
          <ShihuMark size={30} />
          <span className="font-display font-bold text-lg tracking-tight text-shihu-text">
            Shihu Service
          </span>
        </Link>
        <nav className="hidden md:flex gap-1 flex-wrap" aria-label="Navigasi utama">
          {renderNavItems()}
        </nav>
        <button
          type="button"
          className="md:hidden w-10 h-10 rounded-xl border border-shihu-border flex flex-col items-center justify-center gap-1.5 text-shihu-text hover:bg-white/5 transition-colors"
          aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className={`block w-4 h-0.5 bg-current transition-transform ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block w-4 h-0.5 bg-current transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-4 h-0.5 bg-current transition-transform ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </div>
      <div
        id="mobile-navigation"
        className={`md:hidden overflow-hidden border-t border-shihu-border transition-[max-height,opacity] duration-200 ${menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <nav className="site-container py-2 flex flex-col gap-1" aria-label="Navigasi mobile">
          {renderNavItems(true)}
        </nav>
      </div>
    </header>
  );
}
