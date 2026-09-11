"use client";

import { useEffect, useRef, useState } from "react";

export type OrderSource = "DISCORD" | "INSTAGRAM" | "TIKTOK" | "WHATSAPP";

const SOURCE_OPTIONS: { value: OrderSource; label: string }[] = [
  { value: "DISCORD", label: "Discord" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "TIKTOK", label: "TikTok" },
  { value: "WHATSAPP", label: "WhatsApp" },
];

interface OrderSourceFieldsProps {
  customerSourceUsernames?: Partial<Record<OrderSource, string>>;
  defaultValues?: {
    orderSource?: OrderSource;
    sourceUsername?: string;
    sourceWhatsapp?: string | null;
  };
}

export function OrderSourceFields({ customerSourceUsernames, defaultValues }: OrderSourceFieldsProps) {
  const [orderSource, setOrderSource] = useState<OrderSource | "">(defaultValues?.orderSource ?? "");
  const [sourceUsername, setSourceUsername] = useState(defaultValues?.sourceUsername ?? "");
  const autoFilledUsername = useRef("");
  const isWhatsapp = orderSource === "WHATSAPP";

  useEffect(() => {
    if (!orderSource || !customerSourceUsernames) return;
    const nextUsername = customerSourceUsernames[orderSource] ?? "";
    setSourceUsername(nextUsername);
    autoFilledUsername.current = nextUsername;
  }, [customerSourceUsernames, orderSource]);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Tempat order <span className="text-red-400">*</span>
        </label>
        <select
          name="orderSource"
          required
          className="admin-input"
          value={orderSource}
          onChange={(e) => setOrderSource(e.target.value as OrderSource)}
        >
          <option value="" disabled>
            — Pilih platform —
          </option>
          {SOURCE_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className={isWhatsapp ? "grid grid-cols-2 gap-3" : ""}>
        <div>
          <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
            Username <span className="text-red-400">*</span>
          </label>
          <input
            name="sourceUsername"
            required
            value={sourceUsername}
            onChange={(e) => setSourceUsername(e.target.value)}
            className="admin-input"
            placeholder="@username"
          />
        </div>

        {isWhatsapp && (
          <div>
            <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
              Nomor WhatsApp <span className="text-red-400">*</span>
            </label>
            <input
              name="sourceWhatsapp"
              required
              defaultValue={defaultValues?.sourceWhatsapp ?? ""}
              className="admin-input"
              placeholder="08xxxxxxxxxx"
            />
          </div>
        )}
      </div>
    </div>
  );
}
