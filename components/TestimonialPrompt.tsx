"use client";

import { useActionState, useState } from "react";
import {
  submitCustomerTestimonial,
  type SubmitTestimonialState,
} from "@/lib/actions/testimonial";

interface ExistingTestimonial {
  rating: number;
  message: string;
  isPublished: boolean;
}

interface TestimonialPromptProps {
  orderId: string;
  defaultCustomerName: string;
  existing: ExistingTestimonial | null;
  title?: string;
  compact?: boolean;
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5"
          aria-label={`${i} bintang`}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill={(hover || value) >= i ? "#FFB238" : "#413759"}
          >
            <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7L18.2 21 12 17.3 5.8 21l1.6-7.1L2 9.2l7.1-.6L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export function TestimonialPrompt({
  orderId,
  defaultCustomerName,
  existing,
  title = "History pesanan",
  compact = false,
}: TestimonialPromptProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [state, formAction, pending] = useActionState<
    SubmitTestimonialState | undefined,
    FormData
  >(submitCustomerTestimonial, undefined);

  if (existing) {
    return (
      <div className="bg-[#241E38] border border-shihu-border rounded-xl px-3.5 py-2.5 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg
                  key={i}
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill={i <= existing.rating ? "#FFB238" : "#413759"}
                >
                  <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7L18.2 21 12 17.3 5.8 21l1.6-7.1L2 9.2l7.1-.6L12 2z" />
                </svg>
              ))}
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border ${
                existing.isPublished
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : "bg-white/5 text-shihu-muted border-shihu-border"
              }`}
            >
              {existing.isPublished ? "Sudah tayang" : "Menunggu moderasi"}
            </span>
          </div>
          <p className="text-xs text-shihu-text">{existing.message}</p>
        </div>
      </div>
    );
  }

  if (state?.success) {
    return (
      <div className="bg-[#241E38] border border-emerald-500/30 rounded-xl px-3.5 py-2.5">
        <p className="text-xs text-emerald-300">
          Terima kasih! Testimoni kamu sudah terkirim dan akan tayang setelah
          dicek admin.
        </p>
      </div>
    );
  }

  if (compact && !open) {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-shihu-border bg-shihu-card">
        <span className="text-sm font-medium text-shihu-text">{title}</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm font-display font-semibold text-shihu-corona whitespace-nowrap"
        >
          Beri Testimoni →
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-display font-medium px-3 py-1.5 rounded-lg border border-shihu-borderSoft text-shihu-text hover:bg-[#2C2540]"
      >
        Beri Testimoni
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="bg-[#241E38] border border-shihu-border rounded-xl p-3.5 flex flex-col gap-2.5"
    >
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="rating" value={rating} />

      <div>
        <label className="block text-[11px] text-shihu-muted mb-1">
          Nama yang ditampilkan
        </label>
        <input
          name="customerName"
          defaultValue={defaultCustomerName}
          required
          className="admin-input !bg-[#1A1628]"
        />
      </div>

      <div>
        <label className="block text-[11px] text-shihu-muted mb-1">
          Rating
        </label>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <div>
        <label className="block text-[11px] text-shihu-muted mb-1">
          Pesan testimoni
        </label>
        <textarea
          name="message"
          required
          rows={3}
          className="admin-input !bg-[#1A1628] resize-none"
          placeholder="Ceritain pengalaman jokinya gimana..."
        />
      </div>

      {state?.error && (
        <p className="text-[11.5px] text-red-400">{state.error}</p>
      )}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-display font-medium px-3 py-1.5 rounded-lg text-shihu-muted hover:bg-white/5"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={pending || rating === 0}
          className="text-xs font-display font-semibold px-4 py-1.5 rounded-lg bg-corona text-[#1A1206] disabled:opacity-60"
        >
          {pending ? "Mengirim..." : "Kirim Testimoni"}
        </button>
      </div>
    </form>
  );
}
