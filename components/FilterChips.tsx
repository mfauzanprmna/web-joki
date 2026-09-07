"use client";

import Link from "next/link";
import type { GameLite } from "@/types/game";

export function FilterChips({
  games,
  active,
}: {
  games: GameLite[];
  active: string;
}) {
  return (
    <div className="flex gap-2 mb-6 flex-wrap">
      <Chip href="/joki" label="Semua game" isActive={active === "all"} />
      {games.map((g) => (
        <Chip
          key={g.slug}
          href={`/joki?game=${g.slug}`}
          label={g.name}
          isActive={active === g.slug}
          accent={g.accentColor}
        />
      ))}
    </div>
  );
}

function Chip({
  href,
  label,
  isActive,
  accent = "#FFB238",
}: {
  href: string;
  label: string;
  isActive: boolean;
  accent?: string;
}) {
  return (
    <Link
      href={href}
      className="px-4 py-2 rounded-full font-display text-[13px] font-medium border transition-colors"
      style={{
        borderColor: isActive ? accent : "#3D3557",
        backgroundColor: isActive ? `${accent}18` : "transparent",
        color: isActive ? accent : "#B7ADD1",
      }}
    >
      {label}
    </Link>
  );
}
