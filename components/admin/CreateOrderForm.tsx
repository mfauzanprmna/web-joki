"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { createOrder } from "@/lib/actions/order";
import type { OrderActionState } from "@/lib/actions/order";
import { formatRupiah } from "@/lib/format";
import { calculateJokiItemLinePrice } from "@/lib/order-pricing";
import type { JokiItemOption, JokiPaketOption, PatchEventOption, EndgameContentOption, ExportedLine } from "./OrderLineSelector";
import { OrderSourceFields } from "./OrderSourceFields";
import { CustomerSelector, type CustomerOption } from "./CustomerSelector";
import { OrderAccountTab, type AccountData } from "./OrderAccountTab";
import { FaPlus, FaXmark, FaCheck } from "react-icons/fa6";

interface GameOption {
  id: string;
  name: string;
}

interface CreateOrderFormProps {
  games: GameOption[];
  items: JokiItemOption[];
  pakets: JokiPaketOption[];
  events: PatchEventOption[];
  endgameContents: EndgameContentOption[];
  customers: CustomerOption[];
}

const MAX_ACCOUNTS = 10;

function emptyAccount(): AccountData {
  return { accountId: "", accountName: "", accountUid: "", gameId: "", jokerName: "", estimasiJoki: "", lines: [], total: 0 };
}

export function CreateOrderForm({ games, items, pakets, events, endgameContents, customers }: CreateOrderFormProps) {
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
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [confirmFormData, setConfirmFormData] = useState<FormData | null>(null);
  const [discountPercent, setDiscountPercent] = useState("");
  const [discountLabel, setDiscountLabel] = useState("");

  useEffect(() => {
    if (hasSubmittedRef.current && !pending && !state?.error) {
      formRef.current?.reset();
      setFormKey((k) => k + 1);
      setAccountCount(1);
      setActiveTab(0);
      setAccounts([emptyAccount()]);
      setSelectedCustomer(null);
      setDiscountPercent("");
      setDiscountLabel("");
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

  const subtotal = useMemo(() => accounts.reduce((sum, a) => sum + a.total, 0), [accounts]);

  // Validasi ringan di sisi client: cuma terima 0-100, kosong dianggap 0
  // (tidak ada diskon). Validasi ulang yang lebih ketat tetap dilakukan di
  // server (lib/actions/order.ts) -- ini cuma untuk pratinjau harga real-time.
  const discountPercentValue = useMemo(() => {
    const n = Number(discountPercent);
    if (!discountPercent || Number.isNaN(n)) return 0;
    return Math.min(100, Math.max(0, n));
  }, [discountPercent]);

  const discountAmountTotal = useMemo(
    () => Math.round((subtotal * discountPercentValue) / 100),
    [subtotal, discountPercentValue]
  );

  const grandTotal = subtotal - discountAmountTotal;

  /**
   * Hitung potongan untuk satu akun secara proporsional terhadap subtotal-nya
   * (bukan dibagi rata flat) -- supaya akun dengan harga lebih besar dapat
   * potongan nominal lebih besar juga, sebanding dengan porsinya di
   * keseluruhan pesanan. Dipakai untuk pratinjau di modal konfirmasi; server
   * menghitung ulang dengan logika yang sama untuk nilai yang benar-benar
   * disimpan.
   */
  function accountDiscountAmount(accountTotal: number): number {
    if (subtotal <= 0 || discountPercentValue <= 0) return 0;
    return Math.round((accountTotal * discountPercentValue) / 100);
  }

  function lineLabel(line: ExportedLine, account: AccountData): { title: string; price: number } {
    const gameItems = items.filter((item) => item.gameId === account.gameId);
    if (line.type === "item") {
      const item = gameItems.find((candidate) => candidate.id === line.id);
      if (!item) return { title: "Joki Item", price: 0 };
      const result = calculateJokiItemLinePrice(item, {
        explorationPercent: line.explorationPercent,
        actFrom: line.actFrom,
        actTo: line.actTo,
        materialQuantity: line.materialQuantity,
        rawatAkunQuantity: line.rawatAkunQuantity,
      });
      return { title: item.title, price: result.valid ? result.price : 0 };
    }

    const option = line.type === "paket"
      ? pakets.find((paket) => paket.id === line.id)
      : line.type === "event"
        ? events.find((event) => event.id === line.id)
        : endgameContents.find((content) => content.id === line.id);
    return { title: option?.title ?? "Layanan joki", price: option?.priceRupiah ?? 0 };
  }

  function lineDescription(line: ExportedLine): string {
    const details: string[] = [];
    if (line.explorationPercent != null) details.push(`${line.explorationPercent}% sudah dikerjakan`);
    if (line.actFrom != null && line.actTo != null) details.push(`Act ${line.actFrom}-${line.actTo}`);
    if (line.materialQuantity != null) details.push(`${line.materialQuantity} material`);
    if (line.rawatAkunQuantity != null) details.push(`${line.rawatAkunQuantity}x`);
    return details.join(" · ");
  }

  const accountsJson = useMemo(
    () =>
      JSON.stringify(
        accounts.map((a) => ({
          gameId: a.gameId,
          accountId: a.accountId || null,
          accountName: a.accountName || null,
          accountUid: a.accountUid || null,
          jokerName: a.jokerName || null,
          estimasiJoki: a.estimasiJoki || null,
          lines: a.lines,
        }))
      ),
    [accounts]
  );

  return (
    <>
      <form
        ref={formRef}
        onSubmit={(event) => {
          event.preventDefault();
          setConfirmFormData(new FormData(event.currentTarget));
        }}
        className="flex flex-col gap-3 mt-4"
      >
        <input type="hidden" name="accountsJson" value={accountsJson} />

        <p className="font-display text-xs font-semibold text-shihu-muted uppercase tracking-wide">
          Data customer
        </p>

        <CustomerSelector
          key={`customer-${formKey}`}
          customers={customers}
          onCustomerChange={setSelectedCustomer}
        />
        <OrderSourceFields
          key={`source-${formKey}`}
          customerSourceUsernames={selectedCustomer?.sourceUsernames}
        />

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

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
              Diskon (%) <span className="text-shihu-faint font-normal">— opsional</span>
            </label>
            <input
              type="number"
              name="discountPercent"
              min={0}
              max={100}
              step="0.01"
              placeholder="0"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              className="admin-input"
            />
          </div>
          <div>
            <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
              Catatan diskon <span className="text-shihu-faint font-normal">— opsional</span>
            </label>
            <input
              type="text"
              name="discountLabel"
              placeholder="mis. Promo lebaran"
              value={discountLabel}
              onChange={(e) => setDiscountLabel(e.target.value)}
              disabled={discountPercentValue <= 0}
              className="admin-input disabled:opacity-50"
            />
          </div>
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
          <div key={`${formKey}-${selectedCustomer?.id ?? "new"}-${i}`} style={{ display: activeTab === i ? "block" : "none" }}>
            <OrderAccountTab
              games={games}
              items={items}
              pakets={pakets}
              events={events}
              endgameContents={endgameContents}
              accounts={selectedCustomer?.accounts ?? []}
              onChange={(data) => updateAccount(i, data)}
            />
          </div>
        ))}

        <div className="flex flex-col gap-1 bg-[#241E38] border border-shihu-corona/30 rounded-xl px-4 py-3">
          {discountAmountTotal > 0 && (
            <div className="flex items-center justify-between text-[11.5px] text-shihu-muted">
              <span>Subtotal ({accountCount} akun)</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>
          )}
          {discountAmountTotal > 0 && (
            <div className="flex items-center justify-between text-[11.5px] text-red-300">
              <span>Diskon ({discountPercentValue}%)</span>
              <span>-{formatRupiah(discountAmountTotal)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs font-display font-medium text-shihu-muted">
              {discountAmountTotal > 0 ? "Total setelah diskon" : `Total keseluruhan (${accountCount} akun)`}
            </span>
            <span className="font-display font-bold text-shihu-corona text-base">{formatRupiah(grandTotal)}</span>
          </div>
        </div>

        {state?.error && (
          <p className="text-[13px] text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="self-start flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-semibold text-sm text-[#1A1206] bg-corona mt-1 disabled:opacity-60"
        >
          <FaPlus size={12} aria-hidden="true" />
          {pending ? "Menyimpan..." : `Buat ${accountCount > 1 ? `${accountCount} pesanan` : "pesanan"}`}
        </button>
      </form>

      {confirmFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-order-title">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-shihu-card border border-shihu-border rounded-2xl p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 id="confirm-order-title" className="font-display text-lg font-bold">Konfirmasi pesanan</h2>
                <p className="text-shihu-muted text-xs mt-1">Periksa detail pesanan sebelum disimpan.</p>
              </div>
              <button type="button" onClick={() => setConfirmFormData(null)} className="text-shihu-muted text-xl leading-none hover:text-shihu-text" aria-label="Tutup">
                <FaXmark size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="bg-[#241E38] border border-shihu-border rounded-xl p-3 mb-4">
              <p className="text-[11px] text-shihu-faint uppercase tracking-wide">Customer</p>
              <p className="font-display font-semibold text-sm mt-1">
                {selectedCustomer?.name ?? String(confirmFormData.get("newCustomerName") || "Customer baru")}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {accounts.map((account, index) => {
                const gameName = games.find((game) => game.id === account.gameId)?.name ?? "Game belum dipilih";
                const accDiscount = accountDiscountAmount(account.total);
                return (
                  <section key={index} className="border border-shihu-border rounded-xl p-3">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="font-display font-semibold text-sm">{account.accountName || `Akun ${index + 1}`}</p>
                        {account.accountUid && <p className="text-[11px] text-shihu-faint">UID: {account.accountUid}</p>}
                        <p className="text-[11px] text-shihu-muted mt-1">{gameName}</p>
                      </div>
                      <div className="text-right">
                        {accDiscount > 0 && (
                          <p className="text-[11px] text-shihu-faint line-through">{formatRupiah(account.total)}</p>
                        )}
                        <p className="font-display font-bold text-sm text-shihu-corona">
                          {formatRupiah(account.total - accDiscount)}
                        </p>
                      </div>
                    </div>
                    {account.lines.length === 0 ? (
                      <p className="text-xs text-red-300">Belum ada item joki.</p>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {account.lines.map((line) => {
                          const detail = lineLabel(line, account);
                          const description = lineDescription(line);
                          return (
                            <div key={`${line.type}-${line.id}`} className="flex items-start justify-between gap-3 text-xs">
                              <div>
                                <p className="text-shihu-text">{detail.title}</p>
                                {description && <p className="text-[10px] text-shihu-faint">{description}</p>}
                              </div>
                              <span className="text-shihu-muted whitespace-nowrap">{formatRupiah(detail.price)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>

            <div className="flex flex-col gap-1 border-t border-shihu-border mt-4 pt-4">
              {discountAmountTotal > 0 && (
                <>
                  <div className="flex items-center justify-between text-xs text-shihu-muted">
                    <span>Subtotal</span>
                    <span>{formatRupiah(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-red-300">
                    <span>Diskon ({discountPercentValue}%{discountLabel ? ` — ${discountLabel}` : ""})</span>
                    <span>-{formatRupiah(discountAmountTotal)}</span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between">
                <span className="font-display font-semibold text-sm">Total keseluruhan</span>
                <span className="font-display font-bold text-lg text-shihu-corona">{formatRupiah(grandTotal)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button type="button" onClick={() => setConfirmFormData(null)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-display text-sm border border-shihu-border text-shihu-muted">
                <FaXmark size={12} aria-hidden="true" />
                Kembali edit
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!confirmFormData) return;
                  hasSubmittedRef.current = true;
                  setConfirmFormData(null);
                  formAction(confirmFormData);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-display font-semibold text-sm text-[#1A1206] bg-corona disabled:opacity-60"
              >
                <FaCheck size={12} aria-hidden="true" />
                {pending ? "Menyimpan..." : "Ya, buat pesanan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
