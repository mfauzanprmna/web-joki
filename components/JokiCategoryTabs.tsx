"use client";

import { useEffect, useMemo, useState } from "react";
import { JokiCard } from "./JokiCard";
import { Pagination } from "./Pagination";
import type { GameLite } from "@/types/game";
import { FaMagnifyingGlass } from "react-icons/fa6";

export interface JokiDisplayCard {
  key: string;
  title: string;
  description: string;
  priceLabel: string;
  etaLabel: string;
  badge?: string | null;
  game: GameLite;
  categoryName: string;
  regionName?: string | null;
  questTypeName?: string | null;
  supportsRegionFilter?: boolean;
  supportsQuestTypeFilter?: boolean;
  metaTags: (string | null | undefined)[];
}

const PAGE_SIZE = 12;

/**
 * Urutan tab yang "wajar" untuk dilihat lebih dulu, gaya web top-up: Paket
 * biasanya paling menarik (harga sudah dipaketkan), baru kategori item
 * satuan, lalu Event/Endgame yang sifatnya musiman. Kategori yang tidak ada
 * di daftar ini (nama kategori JokiItem custom dari admin) diurutkan
 * alfabetis dan disisipkan setelah "Paket".
 */
const TAB_PRIORITY: Record<string, number> = {
  Paket: 0,
  Event: 90,
  Endgame: 91,
};

function sortCategoryNames(names: string[]): string[] {
  return [...names].sort((a, b) => {
    const pa = TAB_PRIORITY[a] ?? 10;
    const pb = TAB_PRIORITY[b] ?? 10;
    if (pa !== pb) return pa - pb;
    return a.localeCompare(b);
  });
}

/**
 * Navigasi tab kategori + list item untuk halaman satu game (gaya web
 * top-up: pilih game dulu di /[slug], lalu semua layanan game itu tampil di
 * satu halaman ini dikelompokkan per tab kategori -- Paket, tiap kategori
 * Joki Item /Eksplorasi, Quest, dst/, Event, Endgame). Pencarian tetap ada
 * sebagai pelengkap di dalam tab yang aktif, bukan pengganti tab.
 */
export function JokiCategoryTabs({ cards }: { cards: JokiDisplayCard[] }) {
  const categories = useMemo(() => {
    const unique = new Set(cards.map((c) => c.categoryName));
    return sortCategoryNames(Array.from(unique));
  }, [cards]);

  const [activeCategory, setActiveCategory] = useState(categories[0] ?? "");
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [questType, setQuestType] = useState("all");
  const [page, setPage] = useState(1);

  // Kalau daftar kategori berubah (mis. setelah data live reload) dan tab
  // yang lagi aktif sudah tidak ada, jatuhkan ke tab pertama yang tersedia.
  useEffect(() => {
    if (categories.length > 0 && !categories.includes(activeCategory)) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const categoryCards = useMemo(
    () => cards.filter((card) => card.categoryName === activeCategory),
    [cards, activeCategory]
  );

  const showRegionFilter = categoryCards.some((card) => card.supportsRegionFilter);
  const showQuestTypeFilter = categoryCards.some((card) => card.supportsQuestTypeFilter);

  const regions = useMemo(
    () =>
      Array.from(
        new Set(
          categoryCards
            .filter((card) => card.supportsRegionFilter)
            .map((card) => card.regionName)
            .filter((value): value is string => !!value)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [categoryCards]
  );
  const questTypes = useMemo(
    () =>
      Array.from(
        new Set(
          categoryCards
            .filter((card) => card.supportsQuestTypeFilter)
            .map((card) => card.questTypeName)
            .filter((value): value is string => !!value)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [categoryCards]
  );

  useEffect(() => {
    setRegion("all");
    setQuestType("all");
    setQuery("");
    setPage(1);
  }, [activeCategory]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return categoryCards.filter((card) => {
      const matchesRegion = !showRegionFilter || region === "all" || card.regionName === region;
      const matchesQuestType = !showQuestTypeFilter || questType === "all" || card.questTypeName === questType;
      if (!matchesRegion || !matchesQuestType) return false;

      if (!keyword) return true;
      const haystack = [card.title, card.description, ...card.metaTags.filter((t): t is string => !!t)]
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [categoryCards, query, region, questType, showRegionFilter, showQuestTypeFilter]);

  useEffect(() => {
    setPage(1);
  }, [query, region, questType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (categories.length === 0) {
    return (
      <div className="bg-shihu-card border border-shihu-border rounded-2xl p-10 text-center">
        <p className="font-display font-semibold mb-1.5">Belum ada layanan untuk game ini</p>
        <p className="text-shihu-muted text-sm">Coba pilih game lain atau kembali lagi nanti.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Tab kategori, gaya web top-up -- scroll horizontal di layar sempit. */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
        {categories.map((name) => {
          const isActive = name === activeCategory;
          const count = cards.filter((c) => c.categoryName === name).length;
          return (
            <button
              key={name}
              type="button"
              onClick={() => setActiveCategory(name)}
              className={`shrink-0 px-4 py-2.5 rounded-xl font-display text-sm font-semibold border transition-colors whitespace-nowrap ${
                isActive
                  ? "border-shihu-corona bg-shihu-corona/12 text-shihu-corona"
                  : "border-shihu-border text-shihu-muted hover:text-shihu-text hover:border-shihu-borderSoft"
              }`}
            >
              {name}
              <span className={`ml-1.5 text-[11px] ${isActive ? "text-shihu-corona/70" : "text-shihu-faint"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
        <div className="relative flex-1 min-w-0">
          <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-shihu-faint pointer-events-none" size={14} aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Cari di ${activeCategory.toLowerCase()}...`}
            className="w-full bg-shihu-card border border-shihu-border rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-shihu-text outline-none focus:border-shihu-corona transition-colors placeholder:text-shihu-faint"
          />
        </div>

        {showRegionFilter && (
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="bg-shihu-card border border-shihu-border rounded-xl px-3.5 py-2.5 text-sm text-shihu-text outline-none focus:border-shihu-corona transition-colors font-display sm:w-56"
          >
            <option value="all">Semua region</option>
            {regions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        )}

        {showQuestTypeFilter && (
          <select
            value={questType}
            onChange={(e) => setQuestType(e.target.value)}
            className="bg-shihu-card border border-shihu-border rounded-xl px-3.5 py-2.5 text-sm text-shihu-text outline-none focus:border-shihu-corona transition-colors font-display sm:w-56"
          >
            <option value="all">Semua jenis quest</option>
            {questTypes.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        )}
      </div>

      {(query.trim() || region !== "all" || questType !== "all") && (
        <p className="text-shihu-faint text-xs mb-4">
          Menampilkan {filtered.length} dari {categoryCards.length} di {activeCategory}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="bg-shihu-card border border-shihu-border rounded-2xl p-10 text-center">
          <p className="font-display font-semibold mb-1.5">Tidak ada yang cocok</p>
          <p className="text-shihu-muted text-sm">Coba ubah kata kunci pencarian atau filter yang dipilih.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {paged.map((card) => (
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
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
