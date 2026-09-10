"use client";

import { useState, type ReactNode } from "react";
import { Pagination } from "./Pagination";

interface PaginatedListProps {
    items: ReactNode[];
    pageSize?: number;
    /** Kelas wrapper untuk container list (mis. grid 2 kolom vs flex-col). */
    className?: string;
}

/**
 * Bungkus daftar item yang SUDAH di-render di server (Server Component) lalu
 * lakukan pagination murni di client (slice array + tombol halaman) --
 * dipakai untuk halaman publik seperti /history dan /testimoni supaya tidak
 * perlu duplikasi tipe data yang kompleks ke sisi client.
 */
export function PaginatedList({ items, pageSize = 12, className }: PaginatedListProps) {
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const paged = items.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div>
            <div className={className}>{paged}</div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
    );
}