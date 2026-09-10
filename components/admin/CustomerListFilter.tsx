"use client";

import { useEffect, useMemo, useState } from "react";
import { CustomerRowItem } from "./CustomerRowItem";
import { Pagination } from "@/components/Pagination";

interface OrderSummary {
    id: string;
    orderCode: string;
    status: string;
    totalPrice: number;
    game: { name: string; accentColor: string };
}

interface CustomerRow {
    id: string;
    name: string;
    notes: string | null;
    orders: OrderSummary[];
}

const PAGE_SIZE = 15;

export function CustomerListFilter({ customers }: { customers: CustomerRow[] }) {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return customers;
        return customers.filter((c) => {
            const haystack = [c.name, c.notes ?? "", ...c.orders.map((o) => o.orderCode)].join(" ").toLowerCase();
            return haystack.includes(q);
        });
    }, [customers, search]);

    useEffect(() => {
        setPage(1);
    }, [search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    return (
        <div className="flex flex-col gap-3">
            <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama customer atau kode order..."
                className="admin-input"
            />

            <p className="text-shihu-faint text-xs">
                Menampilkan {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} customer
                {filtered.length !== customers.length && ` (total ${customers.length})`}
            </p>

            {filtered.length === 0 ? (
                <div className="bg-shihu-card border border-shihu-border rounded-2xl p-8 text-center">
                    <p className="text-shihu-muted text-sm">Tidak ada customer yang cocok dengan pencarian.</p>
                </div>
            ) : (
                <>
                    <div className="flex flex-col gap-2.5">
                        {paged.map((c) => (
                            <CustomerRowItem key={c.id} customer={c} />
                        ))}
                    </div>
                    <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </>
            )}
        </div>
    );
}