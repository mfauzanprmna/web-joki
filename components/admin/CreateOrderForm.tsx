"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { createOrder } from "@/lib/actions/order";
import type { OrderActionState } from "@/lib/actions/order";
import { formatRupiah } from "@/lib/format";
import type { JokiItemOption, JokiPaketOption } from "./OrderLineSelector";
import { OrderSourceFields } from "./OrderSourceFields";
import { CustomerSelector, type CustomerOption } from "./CustomerSelector";
import { OrderAccountTab, type AccountData } from "./OrderAccountTab";

interface GameOption {
  id: string;
  name: string;
}

interface CreateOrderFormProps {
  games: GameOption[];
  items: JokiItemOption[];
  pakets: JokiPaketOption[];
  customers: CustomerOption[];
}

const MAX_ACCOUNTS = 10;

function emptyAccount(): AccountData {
  return { gameId: "", jokerName: "", estimasiJoki: "", lines: [], total: 0 };
}

export function CreateOrderForm({ games, items, pakets, customers }: CreateOrderFormProps) {
  const [state, formAction, pending] = useActionState<OrderActionState | undefined, FormData>(
    createOrder,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [formKey, setFormKey] = useState(0);
  const hasSubmittedRef = useRef(false);

  const [accountCount, setAccountCount] = useState(1);
  const [activeTab, setActiveTab] = useState(0);
  const [accounts, setAccounts] = useState<AccountData[]>([emptyAccount()]);

  useEffect(() => {
    if (hasSubmittedRef.current && !pending && !state?.error) {
      formRef.current?.reset();
      setFormKey((k) => k + 1);
      setAccountCount(1);
      setActiveTab(0);
      setAccounts([emptyAccount()]);
      hasSubmittedRef.current = false;
    }
  }, [pending, state]);

  function handleAccountCountChange(raw: string) {
    const n = Math.max(1, Math.min(MAX_ACCOUNTS, Number(raw) || 1));
    setAccountCount(n);
    setAccounts((prev) => {
      const next = [...prev];
      while (next.length < n) next.push(emptyAccount());
      while (next.length > n) next.pop();
      return next;
    });
    if (activeTab >= n) setActiveTab(n - 1);
  }

  function updateAccount(index: number, data: AccountData) {
    setAccounts((prev) => {
      const next = [...prev];
      next[index] = data;
      return next;
    });
  }

  const grandTotal = useMemo(() => accounts.reduce((sum, a) => sum + a.total, 0), [accounts]);

  const accountsJson = useMemo(
    () =>
      JSON.stringify(
        accounts.map((a) => ({
          gameId: a.gameId,
          jokerName: a.jokerName || null,
          estimasiJoki: a.estimasiJoki || null,
          lines: a.lines,
        }))
      ),
    [accounts]
  );

  return (
    <form
      ref={formRef}
      action={(formData) => {
        hasSubmittedRef.current = true;
        formAction(formData);
      }}
      className="flex flex-col gap-3 mt-4"
    >
      <input type="hidden" name="accountsJson" value={accountsJson} />

      <p className="font-display text-xs font-semibold text-shihu-muted uppercase tracking-wide">
        Data customer
      </p>

      <CustomerSelector key={`customer-${formKey}`} customers={customers} />
      <OrderSourceFields key={`source-${formKey}`} />

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Jumlah akun yang di-joki
        </label>
        <input
          type="number"
          min={1}
          max={MAX_ACCOUNTS}
          value={accountCount}
          onChange={(e) => handleAccountCountChange(e.target.value)}
          className="admin-input"
        />
        <p className="text-[11px] text-shihu-faint mt-1">
          Tiap akun jadi pesanan (Order) terpisah dengan progres masing-masing, tapi tetap tercatat di bawah satu customer yang sama.
        </p>
      </div>

      <p className="font-display text-xs font-semibold text-shihu-muted uppercase tracking-wide mt-2">
        Detail jokian per akun
      </p>

      {accountCount > 1 && (
        <div className="flex gap-1.5 flex-wrap">
          {Array.from({ length: accountCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveTab(i)}
              className="px-3.5 py-2 rounded-xl font-display text-xs font-medium transition-colors"
              style={{
                backgroundColor: activeTab === i ? "#2C2540" : "transparent",
                color: activeTab === i ? "#FFB238" : "#B7ADD1",
                border: `1px solid ${activeTab === i ? "#FFB23855" : "#3D3557"}`,
              }}
            >
              Akun {i + 1}
              {accounts[i]?.total > 0 && (
                <span className="ml-1.5 text-[10px] opacity-80">{formatRupiah(accounts[i].total)}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {Array.from({ length: accountCount }).map((_, i) => (
        <div key={`${formKey}-${i}`} style={{ display: activeTab === i ? "block" : "none" }}>
          <OrderAccountTab
            games={games}
            items={items}
            pakets={pakets}
            onChange={(data) => updateAccount(i, data)}
          />
        </div>
      ))}

      <div className="flex items-center justify-between bg-[#241E38] border border-shihu-corona/30 rounded-xl px-4 py-3">
        <span className="text-xs font-display font-medium text-shihu-muted">
          Total keseluruhan ({accountCount} akun)
        </span>
        <span className="font-display font-bold text-shihu-corona text-base">{formatRupiah(grandTotal)}</span>
      </div>

      {state?.error && (
        <p className="text-[13px] text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start px-5 py-2.5 rounded-xl font-display font-semibold text-sm text-[#1A1206] bg-corona mt-1 disabled:opacity-60"
      >
        {pending ? "Menyimpan..." : `Buat ${accountCount > 1 ? `${accountCount} pesanan` : "pesanan"}`}
      </button>
    </form>
  );
}
