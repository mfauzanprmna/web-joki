"use client";

import { useState } from "react";

export interface CustomerOption {
  id: string;
  name: string;
  sourceUsernames?: Partial<Record<"DISCORD" | "INSTAGRAM" | "TIKTOK" | "WHATSAPP", string>>;
}

interface CustomerSelectorProps {
  customers: CustomerOption[];
  onCustomerChange?: (customer: CustomerOption | null) => void;
}

export function CustomerSelector({ customers, onCustomerChange }: CustomerSelectorProps) {
  const [mode, setMode] = useState<"existing" | "new">(customers.length > 0 ? "existing" : "new");
  const [search, setSearch] = useState("");
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted">
          Customer <span className="text-red-400">*</span>
        </label>
        {customers.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setMode(mode === "existing" ? "new" : "existing");
              onCustomerChange?.(null);
            }}
            className="text-[11px] text-shihu-corona font-display font-medium"
          >
            {mode === "existing" ? "+ Customer baru" : "← Pilih customer yang ada"}
          </button>
        )}
      </div>

      {mode === "existing" ? (
        <div className="flex flex-col gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-input"
            placeholder="Cari nama customer..."
            aria-label="Cari customer"
          />
          <select
            name="customerId"
            required
            className="admin-input"
            onChange={(e) => onCustomerChange?.(customers.find((customer) => customer.id === e.target.value) ?? null)}
          >
            <option value="" disabled>
              — Pilih customer —
            </option>
            {filteredCustomers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {filteredCustomers.length === 0 && (
            <p className="text-[11px] text-shihu-faint">Customer tidak ditemukan.</p>
          )}
        </div>
      ) : (
        <input
          name="newCustomerName"
          required
          className="admin-input"
          placeholder="Nama customer baru"
        />
      )}
    </div>
  );
}
