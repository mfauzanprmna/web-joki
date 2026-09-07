import Link from "next/link";
import type { ReactNode } from "react";

export function QuickAccessCard({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="bg-shihu-card border border-shihu-border rounded-2xl p-5 transition-colors hover:border-shihu-borderSoft"
    >
      <div className="w-10 h-10 rounded-xl bg-[#2C2540] flex items-center justify-center mb-3 text-shihu-corona">
        {icon}
      </div>
      <h4 className="font-display text-[15.5px] font-semibold mb-1">{title}</h4>
      <p className="text-shihu-muted text-[13px] leading-relaxed">{desc}</p>
    </Link>
  );
}
