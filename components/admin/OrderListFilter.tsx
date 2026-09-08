"use client";

import { useMemo, useState } from "react";
import { OrderRowItem } from "./OrderRowItem";
import { STATUS_LABEL } from "@/types/game";

interface GameOption {
    id: string;
    name: string;
    accentColor: string;
}

interface OrderLineRow {
    id: string;
    explorationPercent: number | null;
    actFrom: number | null;
    actTo: number | null;
    materialQuantity: number | null;
    rawatAkunQuantity: number | null;
    calculatedPrice: number;
    jokiItem: { title: string } | null;
    jokiPaket: { title: string } | null;
}

interface WorkerOption {
    id: string;
    name: string;
}

interface OrderRow {
    id: string;
    orderCode: string;
    jokerName: string | null;
    workerId: string | null;
    status: string;
    progressPct: number;
    estimasiJoki: string | null;
    totalPrice: number;
    orderSource: string;
    sourceUsername: string;
    sourceWhatsapp: string | null;
    game: GameOption;
    customer: { name: string };
    lines: OrderLineRow[];
}

const STATUS_OPTIONS = ["MENUNGGU", "DIKERJAKAN", "FINISHING", "SELESAI", "DIBATALKAN"];

export function OrderListFilter({ orders, games, workers }: { orders: OrderRow[]; games: GameOption[]; workers: WorkerOption[] }) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [gameFilter, setGameFilter] = useState("");

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return orders.filter((o) => {
            if (statusFilter && o.status !== statusFilter) return false;
            if (gameFilter && o.game.id !== gameFilter) return false;
            if (!q) return true;
            const haystack = [
                o.orderCode,
                o.customer.name,
                o.jokerName ?? "",
                o.sourceUsername,
                ...o.lines.map((l) => l.jokiItem?.title ?? l.jokiPaket?.title ?? ""),
            ]
                .join(" ")
                .toLowerCase();
            return haystack.includes(q);
        });
    }, [orders, search, statusFilter, gameFilter]);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari kode order, nama customer, nama joki, atau item..."
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
                    {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                            {STATUS_LABEL[s] ?? s}
                        </option>
                    ))}
                </select>
            </div>

            <p className="text-shihu-faint text-xs">
                Menampilkan {filtered.length} dari {orders.length} pesanan
            </p>

            {filtered.length === 0 ? (
                <div className="bg-shihu-card border border-shihu-border rounded-2xl p-8 text-center">
                    <p className="text-shihu-muted text-sm">Tidak ada pesanan yang cocok dengan filter.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-2.5">
                    {filtered.map((o) => (
                        <OrderRowItem key={o.id} order={o} workers={workers} />
                    ))}
                </div>
            )}
        </div>
    );
}