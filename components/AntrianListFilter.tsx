"use client";

import { useMemo, useState } from "react";
import { QueueRow } from "./QueueRow";
import type { GameLite } from "@/types/game";
import { FaMagnifyingGlass } from "react-icons/fa6";

interface QueueOrderRow {
  id: string;
  orderCode: string;
  title: string;
  customerName: string;
  jokerName: string | null;
  status: string;
  progressPct: number;
  game: GameLite;
  isRawatAkunOnly: boolean;
}

type AntrianTab = "item" | "rawat-akun";

/**
 * Pencarian di halaman antrian customer, berdasarkan kode pesanan atau nama
 * pemesan (dan sebagai bonus, nama joki yang mengerjakan), supaya customer
 * bisa cepat menemukan pesanannya di antara banyak antrian yang berjalan.
 */
const TABS: { key: AntrianTab; label: string }[] = [
  { key: "item", label: "Joki Item" },
  { key: "rawat-akun", label: "Rawat Akun" },
];

export function AntrianListFilter({ orders }: { orders: QueueOrderRow[] }) {
  const [search, setSearch] = useState("");

  const itemOrders = useMemo(() => orders.filter((o) => !o.isRawatAkunOnly), [orders]);
  const rawatAkunOrders = useMemo(() => orders.filter((o) => o.isRawatAkunOnly), [orders]);

  // Default ke tab yang ada isinya kalau salah satu kosong (mis. toko yang
  // cuma buka layanan Rawat Akun, atau sebaliknya) -- supaya customer tidak
  // mendarat di tab kosong tanpa penjelasan begitu buka halaman ini.
  const [activeTab, setActiveTab] = useState<AntrianTab>(() => (itemOrders.length > 0 ? "item" : "rawat-akun"));

  const activeOrders = activeTab === "item" ? itemOrders : rawatAkunOrders;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeOrders;
    return activeOrders.filter((o) => {
      const haystack = [o.orderCode, o.customerName, o.jokerName ?? "", o.title]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [activeOrders, search]);

  return (
    <div>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          const count = tab.key === "item" ? itemOrders.length : rawatAkunOrders.length;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 px-4 py-2.5 rounded-xl font-display text-sm font-semibold border transition-colors whitespace-nowrap ${
                isActive
                  ? "border-shihu-corona bg-shihu-corona/12 text-shihu-corona"
                  : "border-shihu-border text-shihu-muted hover:text-shihu-text hover:border-shihu-borderSoft"
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-[11px] ${isActive ? "text-shihu-corona/70" : "text-shihu-faint"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative mb-4">
        <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-shihu-faint pointer-events-none" size={14} aria-hidden="true" />
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
          Menampilkan {filtered.length} dari {activeOrders.length} antrian
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="bg-shihu-card border border-shihu-border rounded-2xl p-10 text-center">
          <p className="font-display font-semibold mb-1.5">
            {activeOrders.length === 0 ? "Belum ada antrian di sini" : "Pesanan tidak ditemukan"}
          </p>
          <p className="text-shihu-muted text-sm">
            {activeOrders.length === 0
              ? `Tidak ada antrian ${activeTab === "item" ? "Joki Item" : "Rawat Akun"} yang sedang berjalan saat ini.`
              : "Periksa kembali kode pesanan atau nama yang kamu masukkan."}
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
