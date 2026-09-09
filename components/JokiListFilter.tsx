"use client";

import { useMemo, useState } from "react";
import { JokiCard } from "./JokiCard";
import type { GameLite } from "@/types/game";

export interface JokiDisplayCard {
  key: string;
  title: string;
  description: string;
  priceLabel: string;
  etaLabel: string;
  badge?: string | null;
  game: GameLite;
  categoryName: string;
  metaTags: (string | null | undefined)[];
}

/**
 * Filter kategori + pencarian di halaman list joki customer. Filter game
 * (per game apa) sudah ditangani server-side lewat query string ?game=,
 * jadi komponen ini menangani lapisan filter tambahan di sisi client:
 * kategori (mis. "Paket", "Event", "Rawat Akun", dst) dan kata kunci bebas.
 */
export function JokiListFilter({ cards }: { cards: JokiDisplayCard[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const categories = useMemo(() => {
    const unique = new Set(cards.map((c) => c.categoryName));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [cards]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return cards.filter((card) => {
      const matchesCategory = category === "all" || card.categoryName === category;
      if (!matchesCategory) return false;

      if (!keyword) return true;
      const haystack = [
        card.title,
        card.description,
        card.categoryName,
        card.badge ?? "",
        ...card.metaTags.filter((t): t is string => !!t),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [cards, query, category]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-shihu-faint pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama paket, deskripsi, atau tag..."
            className="w-full bg-shihu-card border border-shihu-border rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-shihu-text outline-none focus:border-shihu-corona transition-colors placeholder:text-shihu-faint"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-shihu-card border border-shihu-border rounded-xl px-3.5 py-2.5 text-sm text-shihu-text outline-none focus:border-shihu-corona transition-colors font-display sm:w-56"
        >
          <option value="all">Semua kategori</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {(query.trim() || category !== "all") && (
        <p className="text-shihu-faint text-xs mb-4">
          Menampilkan {filtered.length} dari {cards.length} paket
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="bg-shihu-card border border-shihu-border rounded-2xl p-10 text-center">
          <p className="font-display font-semibold mb-1.5">
            Tidak ada paket yang cocok
          </p>
          <p className="text-shihu-muted text-sm">
            Coba ubah kata kunci pencarian atau kategori yang dipilih.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filtered.map((card) => (
            <JokiCard
              key={card.key}
              title={card.title}
              description={card.description}
              priceLabel={card.priceLabel}
              etaLabel={card.etaLabel}
              badge={card.badge}
              game={card.game}
              metaTags={card.metaTags}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
