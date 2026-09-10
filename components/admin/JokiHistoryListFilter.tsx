"use client";

import { useEffect, useMemo, useState } from "react";
import { JokiHistoryRowItem } from "./JokiHistoryRowItem";
import { Pagination } from "@/components/Pagination";
import { GameCountBadges } from "@/components/GameCountBadges";

interface JokiHistoryRow {
    id: string;
    title: string;
    customer: { name: string };
    jokerName: string | null;
    completedAt: Date;
    rating: number | null;
    note: string | null;
    screenshotUrls: string[];
    shareToken: string;
    hasTestimonial: boolean;
    game: { id: string; name: string; accentColor: string };
}

interface GameOption {
    id: string;
    name: string;
    accentColor: string;
}

const PAGE_SIZE = 15;

export function JokiHistoryListFilter({ entries, games }: { entries: JokiHistoryRow[]; games: GameOption[] }) {
    const [search, setSearch] = useState("");
    const [gameFilter, setGameFilter] = useState("");
    const [page, setPage] = useState(1);

    const gameCounts = useMemo(
        () =>
            games.map((g) => ({
                ...g,
                count: entries.filter((e) => e.game.id === g.id).length,
            })),
        [entries, games]
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return entries.filter((e) => {
            if (gameFilter && e.game.id !== gameFilter) return false;
            if (!q) return true;
            const haystack = [e.title, e.customer.name, e.jokerName ?? ""].join(" ").toLowerCase();
            return haystack.includes(q);
        });
    }, [entries, search, gameFilter]);

    useEffect(() => {
        setPage(1);
    }, [search, gameFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="flex flex-col gap-3">
            <GameCountBadges counts={gameCounts} />

            <div className="flex flex-wrap gap-2">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari judul, nama customer, atau nama joki..."
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
            </div>

            <p className="text-shihu-faint text-xs">
                Menampilkan {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} entri
                {filtered.length !== entries.length && ` (total ${entries.length})`}
            </p>

            {filtered.length === 0 ? (
                <div className="bg-shihu-card border border-shihu-border rounded-2xl p-8 text-center">
                    <p className="text-shihu-muted text-sm">Tidak ada entri yang cocok dengan filter.</p>
                </div>
            ) : (
                <>
                    <div className="flex flex-col gap-2.5">
                        {paged.map((e) => (
                            <JokiHistoryRowItem key={e.id} item={e} />
                        ))}
                    </div>
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </>
            )}
        </div>
    );
}