"use client";

import { useState } from "react";

export interface CustomerOption {
  id: string;
  name: string;
}

interface CustomerSelectorProps {
  customers: CustomerOption[];
}

export function CustomerSelector({ customers }: CustomerSelectorProps) {
  const [mode, setMode] = useState<"existing" | "new">(customers.length > 0 ? "existing" : "new");

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted">
          Customer <span className="text-red-400">*</span>
        </label>
        {customers.length > 0 && (
          <button
            type="button"
            onClick={() => setMode(mode === "existing" ? "new" : "existing")}
            className="text-[11px] text-shihu-corona font-display font-medium"
          >
            {mode === "existing" ? "+ Customer baru" : "← Pilih customer yang ada"}
          </button>
        )}
      </div>

      {mode === "existing" ? (
        <select name="customerId" required className="admin-input">
          <option value="" disabled>
            — Pilih customer —
          </option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
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
