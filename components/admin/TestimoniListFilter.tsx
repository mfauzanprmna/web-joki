"use client";

import { useEffect, useMemo, useState } from "react";
import { TestimonialRowItem } from "./TestimonialRowItem";
import { Pagination } from "@/components/Pagination";
import { GameCountBadges } from "@/components/GameCountBadges";

interface TestimonialRow {
    id: string;
    customerName: string;
    rating: number;
    message: string;
    isPublished: boolean;
    game: { id: string; name: string; accentColor: string };
}

interface GameOption {
    id: string;
    name: string;
    accentColor: string;
}

const PAGE_SIZE = 15;

export function TestimoniListFilter({ testimonials, games }: { testimonials: TestimonialRow[]; games: GameOption[] }) {
    const [search, setSearch] = useState("");
    const [gameFilter, setGameFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(1);

    const gameCounts = useMemo(
        () =>
            games.map((g) => ({
                ...g,
                count: testimonials.filter((t) => t.game.id === g.id).length,
            })),
        [testimonials, games]
    );

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return testimonials.filter((t) => {
            if (gameFilter && t.game.id !== gameFilter) return false;
            if (statusFilter === "published" && !t.isPublished) return false;
            if (statusFilter === "hidden" && t.isPublished) return false;
            if (!q) return true;
            return [t.customerName, t.message].join(" ").toLowerCase().includes(q);
        });
    }, [testimonials, search, gameFilter, statusFilter]);

    useEffect(() => {
        setPage(1);
    }, [search, gameFilter, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="flex flex-col gap-3">
            <GameCountBadges counts={gameCounts} />

            <div className="flex flex-wrap gap-2">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nama customer atau isi pesan..."
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
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="admin-input !w-auto">
                    <option value="">Semua status</option>
                    <option value="published">Tayang</option>
                    <option value="hidden">Disembunyikan</option>
                </select>
            </div>

            <p className="text-shihu-faint text-xs">
                Menampilkan {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} testimoni
                {filtered.length !== testimonials.length && ` (total ${testimonials.length})`}
            </p>

            {filtered.length === 0 ? (
                <div className="bg-shihu-card border border-shihu-border rounded-2xl p-8 text-center">
                    <p className="text-shihu-muted text-sm">Tidak ada testimoni yang cocok dengan filter.</p>
                </div>
            ) : (
                <>
                    <div className="flex flex-col gap-2.5">
                        {paged.map((t) => (
                            <TestimonialRowItem key={t.id} item={t} />
                        ))}
                    </div>
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </>
            )}
        </div>
    );
}