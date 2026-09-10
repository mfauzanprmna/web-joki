"use client";

import { useEffect, useMemo, useState } from "react";
import {
    JokiItemRowItem,
} from "./JokiItemRowItem";
import { Pagination } from "@/components/Pagination";
import type {
    GameOption,
    CategoryOption,
    RegionOption,
    QuestTypeOption,
    PatchOption,
    EndgameContentOption,
} from "./JokiItemFormFields";

interface JokiItemRow {
    id: string;
    title: string;
    description: string;
    priceRupiah: number;
    etaLabel: string;
    badge: string | null;
    isActive: boolean;
    gameId: string;
    categoryId: string;
    regionId: string | null;
    questTypeId: string | null;
    includeEvent: boolean;
    isPatchWide: boolean;
    patchId: string | null;
    actNumber: number | null;
    unitQuantity: number | null;
    durationDays: number | null;
    game: { name: string; accentColor: string };
    category: { name: string; isRawatAkun: boolean; isMaterial: boolean; requiresCharacterLevel: boolean };
    region: { name: string } | null;
    questType: { name: string } | null;
    patch: { name: string } | null;
    endgameContent: { endgameContentId: string }[];
}

interface JokiItemListFilterProps {
    items: JokiItemRow[];
    games: GameOption[];
    categories: CategoryOption[];
    regions: RegionOption[];
    questTypes: QuestTypeOption[];
    patches: PatchOption[];
    endgameContents: EndgameContentOption[];
}

const PAGE_SIZE = 15;

export function JokiItemListFilter({
    items,
    games,
    categories,
    regions,
    questTypes,
    patches,
    endgameContents,
}: JokiItemListFilterProps) {
    const [search, setSearch] = useState("");
    const [gameFilter, setGameFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter((item) => {
            if (gameFilter && item.gameId !== gameFilter) return false;
            if (categoryFilter && item.categoryId !== categoryFilter) return false;
            if (statusFilter === "active" && !item.isActive) return false;
            if (statusFilter === "inactive" && item.isActive) return false;
            if (q && !item.title.toLowerCase().includes(q) && !item.description.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [items, search, gameFilter, categoryFilter, statusFilter]);

    useEffect(() => {
        setPage(1);
    }, [search, gameFilter, categoryFilter, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nama atau deskripsi item..."
                    className="admin-input flex-1 min-w-[220px]"
                />
                <select value={gameFilter} onChange={(e) => setGameFilter(e.target.value)} className="admin-input !w-auto">
                    <option value="">Semua game</option>
                    {games.map((g) => (
                        <option key={g.id} value={g.id}>
                            {g.name}
                        </option>
                    ))}
                </select>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="admin-input !w-auto">
                    <option value="">Semua kategori</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="admin-input !w-auto">
                    <option value="">Semua status</option>
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                </select>
            </div>

            <p className="text-shihu-faint text-xs">
                Menampilkan {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} item
                {filtered.length !== items.length && ` (total ${items.length})`}
            </p>

            {filtered.length === 0 ? (
                <div className="bg-shihu-card border border-shihu-border rounded-2xl p-8 text-center">
                    <p className="text-shihu-muted text-sm">Tidak ada item yang cocok dengan filter.</p>
                </div>
            ) : (
                <>
                    <div className="flex flex-col gap-2.5">
                        {paged.map((item) => (
                            <JokiItemRowItem
                                key={item.id}
                                item={item}
                                games={games}
                                categories={categories}
                                regions={regions}
                                questTypes={questTypes}
                                patches={patches}
                                endgameContents={endgameContents}
                            />
                        ))}
                    </div>
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </>
            )}
        </div>
    );
}