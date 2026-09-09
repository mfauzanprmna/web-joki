"use client";

import { useEffect } from "react";

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
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 9v4.5M12 17h.01M10.6 3.9l-8.4 14.5a1.6 1.6 0 001.4 2.4h16.8a1.6 1.6 0 001.4-2.4L13.4 3.9a1.6 1.6 0 00-2.8 0z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <p className="font-display font-semibold mb-1.5">Gagal memuat halaman ini</p>
      <p className="text-shihu-muted text-sm mb-5">
        Terjadi kesalahan saat memuat data.
        {error.digest ? ` Kode error: ${error.digest}` : ""}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="px-4 py-2.5 rounded-xl font-display font-semibold text-sm text-[#1A1206] bg-corona hover:opacity-90 transition-opacity"
      >
        Coba lagi
      </button>
    </div>
  );
}
