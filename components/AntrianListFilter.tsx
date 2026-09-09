"use client";

import { useMemo, useState } from "react";
import { QueueRow } from "./QueueRow";
import type { GameLite } from "@/types/game";

interface QueueOrderRow {
  id: string;
  orderCode: string;
  title: string;
  customerName: string;
  jokerName: string | null;
  status: string;
  progressPct: number;
  game: GameLite;
}

/**
 * Pencarian di halaman antrian customer, berdasarkan kode pesanan atau nama
 * pemesan (dan sebagai bonus, nama joki yang mengerjakan), supaya customer
 * bisa cepat menemukan pesanannya di antara banyak antrian yang berjalan.
 */
export function AntrianListFilter({ orders }: { orders: QueueOrderRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      const haystack = [o.orderCode, o.customerName, o.jokerName ?? "", o.title]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [orders, search]);

  return (
    <div>
      <div className="relative mb-4">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-shihu-faint pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari kode pesanan atau nama pemesan..."
          className="w-full bg-shihu-card border border-shihu-border rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-shihu-text outline-none focus:border-shihu-corona transition-colors placeholder:text-shihu-faint"
        />
      </div>

      {search.trim() && (
        <p className="text-shihu-faint text-xs mb-3">
          Menampilkan {filtered.length} dari {orders.length} antrian
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="bg-shihu-card border border-shihu-border rounded-2xl p-10 text-center">
          <p className="font-display font-semibold mb-1.5">Pesanan tidak ditemukan</p>
          <p className="text-shihu-muted text-sm">
            Periksa kembali kode pesanan atau nama yang kamu masukkan.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((o) => (
            <QueueRow
              key={o.id}
              orderCode={o.orderCode}
              title={o.title}
              customerName={o.customerName}
              jokerName={o.jokerName}
              status={o.status}
              progressPct={o.progressPct}
              game={o.game}
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
