"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShihuMark } from "./ShihuMark";

const NAV_ITEMS = [
  { href: "/", label: "Beranda" },
  { href: "/joki", label: "List joki" },
  { href: "/antrian", label: "Antrian" },
  { href: "/history", label: "History" },
  { href: "/testimoni", label: "Testimoni" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-shihu-bg/85 backdrop-blur-md border-b border-shihu-border">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <Link href="/" className="flex items-center gap-2.5">
          <ShihuMark size={30} />
          <span className="font-display font-bold text-lg tracking-tight text-shihu-text">
            Shihu Service
          </span>
        </Link>
        <nav className="flex gap-1 flex-wrap">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3.5 py-2 rounded-[10px] font-display text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#2C2540] text-shihu-corona"
                    : "text-shihu-muted hover:text-shihu-text"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
