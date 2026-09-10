"use client";

import { useState } from "react";
import Link from "next/link";
import { updateOrder, deleteOrder } from "@/lib/actions/order";
import { assignWorkerToOrder } from "@/lib/actions/worker";
import { STATUS_LABEL } from "@/types/game";
import { formatRupiah } from "@/lib/format";
import { buildOrderTitle } from "@/lib/order-display";
import { calculateWorkerCommission } from "@/lib/commission";

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
  characterName?: string | null;
  levelFrom?: number | null;
  levelTo?: number | null;
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

const STATUS_OPTIONS = [
  "MENUNGGU",
  "DIKERJAKAN",
  "FINISHING",
  "SELESAI",
  "DIBATALKAN",
];

const SOURCE_LABEL: Record<string, string> = {
  DISCORD: "Discord",
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  WHATSAPP: "WhatsApp",
};

function describeLine(line: OrderLineRow): string {
  const title = line.jokiItem?.title ?? line.jokiPaket?.title ?? "Item tidak dikenal";
  const details: string[] = [];
  if (line.explorationPercent != null) details.push(`${line.explorationPercent}% sudah dikerjakan`);
  if (line.actFrom != null && line.actTo != null) details.push(`Act ${line.actFrom}-${line.actTo}`);
  if (line.materialQuantity != null) details.push(`${line.materialQuantity} material`);
  if (line.rawatAkunQuantity != null) details.push(`${line.rawatAkunQuantity}x rawat akun`);
  if (line.characterName) details.push(line.characterName);
  if (line.levelFrom != null && line.levelTo != null) details.push(`Lv ${line.levelFrom}-${line.levelTo}`);
  const detailStr = details.length > 0 ? ` (${details.join(", ")})` : "";
  return `${title}${detailStr} — ${formatRupiah(line.calculatedPrice)}`;
}

export function OrderRowItem({ order, workers }: { order: OrderRow; workers: WorkerOption[] }) {
  const [editing, setEditing] = useState(false);
  const commission = calculateWorkerCommission(order.totalPrice);

  if (!editing) {
    return (
      <div className="bg-shihu-card border border-shihu-border rounded-2xl p-4 flex flex-col gap-2.5">
        <div className="flex items-center gap-4 flex-wrap">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: order.game.accentColor }}
          />
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-shihu-faint font-display">
                {order.orderCode}
              </span>
              <p className="font-display text-sm font-semibold">
                {buildOrderTitle(order.lines)}
              </p>
            </div>
            <p className="text-shihu-muted text-xs mt-0.5">
              {order.customer.name} · {STATUS_LABEL[order.status] ?? order.status} ({order.progressPct}%)
              {order.estimasiJoki && ` · Estimasi: ${order.estimasiJoki}`}
            </p>
            <p className="text-shihu-faint text-[11px] mt-0.5">
              {SOURCE_LABEL[order.orderSource] ?? order.orderSource} · {order.sourceUsername}
              {order.sourceWhatsapp && ` · WA: ${order.sourceWhatsapp}`}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display font-bold text-shihu-corona text-sm whitespace-nowrap">
              {formatRupiah(order.totalPrice)}
            </p>
            <p className="text-[10.5px] text-shihu-faint whitespace-nowrap">
              Komisi worker: {formatRupiah(commission)}
            </p>
          </div>
          <form action={assignWorkerToOrder}>
            <input type="hidden" name="orderId" value={order.id} />
            <select
              name="workerId"
              defaultValue={order.workerId ?? ""}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="admin-input !w-auto !py-1.5 !text-xs"
            >
              <option value="">Belum ditugaskan</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </form>
          <Link
            href={`/admin/progress/${order.id}`}
            className="px-3 py-1.5 rounded-lg text-xs font-display font-medium border border-shihu-corona/40 text-shihu-corona hover:bg-shihu-corona/10"
          >
            Progress
          </Link>
          <button
            onClick={() => setEditing(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-display font-medium border border-shihu-borderSoft text-shihu-text hover:bg-[#2C2540]"
          >
            Edit
          </button>
        </div>

        {order.lines.length > 1 && (
          <div className="pl-5 flex flex-col gap-0.5">
            {order.lines.map((line) => (
              <p key={line.id} className="text-[11px] text-shihu-faint">
                · {describeLine(line)}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        await updateOrder(formData);
        setEditing(false);
      }}
      className="bg-shihu-card border border-shihu-corona/40 rounded-2xl p-4 flex flex-col gap-3"
    >
      <input type="hidden" name="id" value={order.id} />
      <p className="font-display text-xs text-shihu-faint">
        {order.orderCode} · {order.customer.name}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
            Nama joki
          </label>
          <input
            name="jokerName"
            defaultValue={order.jokerName ?? ""}
            className="admin-input"
            placeholder="Belum ditugaskan"
          />
        </div>
        <div>
          <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
            Status
          </label>
          <select name="status" defaultValue={order.status} className="admin-input">
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Progres (%)
        </label>
        <input
          type="number"
          name="progressPct"
          defaultValue={order.progressPct}
          min={0}
          max={100}
          className="admin-input"
        />
      </div>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Estimasi pengerjaan
        </label>
        <input
          name="estimasiJoki"
          defaultValue={order.estimasiJoki ?? ""}
          className="admin-input"
          placeholder="mis. 2-3 hari"
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
            fd.set("id", order.id);
            deleteOrder(fd);
          }}
          className="ml-auto px-4 py-2 rounded-xl font-display font-medium text-xs text-red-400 hover:bg-red-400/10"
        >
          Hapus
        </button>
      </div>
    </form>
  );
}