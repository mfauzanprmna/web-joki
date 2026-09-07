"use client";

import { useState } from "react";
import { updateTestimonial, deleteTestimonial } from "@/lib/actions/testimonial";
import { Stars } from "@/components/Stars";

interface TestimonialRow {
  id: string;
  customerName: string;
  rating: number;
  message: string;
  isPublished: boolean;
  game: { name: string; accentColor: string };
}

export function TestimonialRowItem({ item }: { item: TestimonialRow }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="bg-shihu-card border border-shihu-border rounded-2xl p-4 flex items-center gap-4 flex-wrap">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: item.game.accentColor }}
        />
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display text-sm font-semibold">{item.customerName}</p>
            <Stars rating={item.rating} />
            {!item.isPublished && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-400/15 text-red-400 font-display">
                Disembunyikan
              </span>
            )}
          </div>
          <p className="text-shihu-muted text-xs mt-0.5 line-clamp-1">
            {item.game.name} · &ldquo;{item.message}&rdquo;
          </p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="px-3 py-1.5 rounded-lg text-xs font-display font-medium border border-shihu-borderSoft text-shihu-text hover:bg-[#2C2540]"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        await updateTestimonial(formData);
        setEditing(false);
      }}
      className="bg-shihu-card border border-shihu-corona/40 rounded-2xl p-4 flex flex-col gap-3"
    >
      <input type="hidden" name="id" value={item.id} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
            Nama customer
          </label>
          <input
            name="customerName"
            defaultValue={item.customerName}
            required
            className="admin-input"
          />
        </div>
        <div>
          <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
            Rating (1-5)
          </label>
          <input
            type="number"
            name="rating"
            defaultValue={item.rating}
            min={1}
            max={5}
            required
            className="admin-input"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
          Pesan testimoni
        </label>
        <textarea
          name="message"
          defaultValue={item.message}
          rows={2}
          required
          className="admin-input"
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-shihu-muted font-display">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={item.isPublished}
          className="accent-shihu-corona"
        />
        Tampilkan testimoni ini ke customer
      </label>

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
            fd.set("id", item.id);
            deleteTestimonial(fd);
          }}
          className="ml-auto px-4 py-2 rounded-xl font-display font-medium text-xs text-red-400 hover:bg-red-400/10"
        >
          Hapus
        </button>
      </div>
    </form>
  );
}
