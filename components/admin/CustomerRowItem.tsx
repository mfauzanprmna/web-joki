"use client";

import { useState } from "react";
import { updateCustomer, deleteCustomer } from "@/lib/actions/customer";
import { formatRupiah } from "@/lib/format";
import { STATUS_LABEL } from "@/types/game";

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

export function CustomerRowItem({ customer }: { customer: CustomerRow }) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await updateCustomer(formData);
          setEditing(false);
        }}
        className="bg-shihu-card border border-shihu-corona/40 rounded-2xl p-4 flex flex-col gap-3"
      >
        <input type="hidden" name="id" value={customer.id} />

        <div>
          <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
            Nama customer
          </label>
          <input
            name="name"
            defaultValue={customer.name}
            required
            className="admin-input"
          />
        </div>

        <div>
          <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
            Catatan (opsional)
          </label>
          <textarea
            name="notes"
            defaultValue={customer.notes ?? ""}
            rows={2}
            className="admin-input"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            className="px-4 py-2 rounded-xl font-display font-semibold text-xs text-[#1A1206] bg-corona"
          >
            Simpan
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="px-4 py-2 rounded-xl font-display font-medium text-xs border border-shihu-borderSoft"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              const fd = new FormData();
              fd.set("id", customer.id);
              deleteCustomer(fd);
            }}
            className="ml-auto px-4 py-2 rounded-xl font-display font-medium text-xs text-red-400 hover:bg-red-400/10"
          >
            Hapus
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="bg-shihu-card border border-shihu-border rounded-2xl p-4 flex flex-col gap-2.5">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <p className="font-display text-sm font-semibold">{customer.name}</p>
          <p className="text-shihu-muted text-xs mt-0.5">
            {customer.orders.length} order
            {customer.notes && ` · ${customer.notes}`}
          </p>
        </div>
        {customer.orders.length > 0 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="px-3 py-1.5 rounded-lg text-xs font-display font-medium border border-shihu-borderSoft text-shihu-text hover:bg-[#2C2540]"
          >
            {expanded ? "Sembunyikan" : "Lihat order"}
          </button>
        )}
        <button
          onClick={() => setEditing(true)}
          className="px-3 py-1.5 rounded-lg text-xs font-display font-medium border border-shihu-borderSoft text-shihu-text hover:bg-[#2C2540]"
        >
          Edit
        </button>
      </div>

      {expanded && (
        <div className="pl-2 flex flex-col gap-1.5 border-l-2 border-shihu-border ml-1">
          {customer.orders.map((o) => (
            <div key={o.id} className="flex items-center gap-2 text-[11.5px] pl-3">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: o.game.accentColor }}
              />
              <span className="text-shihu-faint font-display">{o.orderCode}</span>
              <span className="text-shihu-muted">{o.game.name}</span>
              <span className="text-shihu-muted">{STATUS_LABEL[o.status] ?? o.status}</span>
              <span className="text-shihu-corona font-display font-semibold ml-auto">
                {formatRupiah(o.totalPrice)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
