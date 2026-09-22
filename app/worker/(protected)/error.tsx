"use client";

import { useEffect } from "react";
import { FaTriangleExclamation, FaArrowRotateRight } from "react-icons/fa6";

export default function WorkerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Terjadi error di panel worker:", error);
  }, [error]);

  return (
    <div className="bg-shihu-card border border-shihu-border rounded-2xl p-10 text-center">
      <div className="h-14 w-14 rounded-full bg-[#E2504A18] text-[#E2504A] flex items-center justify-center mx-auto mb-4">
        <FaTriangleExclamation size={22} aria-hidden="true" />
      </div>
      <p className="font-display font-semibold mb-1.5">Gagal memuat halaman ini</p>
      <p className="text-shihu-muted text-sm mb-5">
        Terjadi kesalahan saat memuat data.
        {error.digest ? ` Kode error: ${error.digest}` : ""}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="flex items-center justify-center gap-2 mx-auto px-4 py-2.5 rounded-xl font-display font-semibold text-sm text-[#1A1206] bg-corona hover:opacity-90 transition-opacity"
      >
        <FaArrowRotateRight size={13} aria-hidden="true" />
        Coba lagi
      </button>
    </div>
  );
}
