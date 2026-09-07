"use client";

import { useActionState, useState } from "react";
import {
    submitJokiHistoryTestimonial,
    type SubmitTestimonialState,
} from "@/lib/actions/testimonial";

interface ExistingTestimonial {
    rating: number;
    message: string;
    isPublished: boolean;
}

interface JokiHistoryTestimonialFormProps {
    shareToken: string;
    defaultCustomerName: string;
    existing: ExistingTestimonial | null;
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
                        width="26"
                        height="26"
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

export function JokiHistoryTestimonialForm({
    shareToken,
    defaultCustomerName,
    existing,
}: JokiHistoryTestimonialFormProps) {
    const [rating, setRating] = useState(0);
    const [state, formAction, pending] = useActionState<
        SubmitTestimonialState | undefined,
        FormData
    >(submitJokiHistoryTestimonial, undefined);

    if (existing) {
        return (
            <div className="bg-shihu-card border border-shihu-border rounded-2xl p-5">
                <p className="font-display text-sm font-semibold mb-3">
                    Testimoni kamu
                </p>
                <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <svg
                                key={i}
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill={i <= existing.rating ? "#FFB238" : "#413759"}
                            >
                                <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7L18.2 21 12 17.3 5.8 21l1.6-7.1L2 9.2l7.1-.6L12 2z" />
                            </svg>
                        ))}
                    </div>
                    <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${existing.isPublished
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                : "bg-white/5 text-shihu-muted border-shihu-border"
                            }`}
                    >
                        {existing.isPublished ? "Sudah tayang" : "Menunggu moderasi"}
                    </span>
                </div>
                <p className="text-sm text-shihu-text">{existing.message}</p>
                <p className="text-xs text-shihu-faint mt-3">
                    Terima kasih sudah kasih testimoni!
                </p>
            </div>
        );
    }

    if (state?.success) {
        return (
            <div className="bg-shihu-card border border-emerald-500/30 rounded-2xl p-5">
                <p className="text-sm text-emerald-300">
                    Terima kasih! Testimoni kamu sudah terkirim dan akan tayang setelah
                    dicek admin.
                </p>
            </div>
        );
    }

    return (
        <form
            action={formAction}
            className="bg-shihu-card border border-shihu-border rounded-2xl p-5 flex flex-col gap-3.5"
        >
            <p className="font-display text-sm font-semibold">
                Kasih testimoni buat joki ini
            </p>
            <input type="hidden" name="shareToken" value={shareToken} />
            <input type="hidden" name="rating" value={rating} />

            <div>
                <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
                    Nama yang ditampilkan
                </label>
                <input
                    name="customerName"
                    defaultValue={defaultCustomerName}
                    required
                    className="admin-input"
                />
            </div>

            <div>
                <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
                    Rating
                </label>
                <StarPicker value={rating} onChange={setRating} />
            </div>

            <div>
                <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
                    Pesan testimoni
                </label>
                <textarea
                    name="message"
                    required
                    rows={4}
                    className="admin-input resize-none"
                    placeholder="Ceritain pengalaman jokinya gimana..."
                />
            </div>

            {state?.error && (
                <p className="text-[12px] text-red-400 bg-red-400/10 rounded-lg px-2.5 py-1.5">
                    {state.error}
                </p>
            )}

            <button
                type="submit"
                disabled={pending || rating === 0}
                className="self-start px-5 py-2.5 rounded-xl font-display font-semibold text-sm text-[#1A1206] bg-corona disabled:opacity-60"
            >
                {pending ? "Mengirim..." : "Kirim Testimoni"}
            </button>
        </form>
    );
}
