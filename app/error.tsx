"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShihuMark } from "@/components/ShihuMark";
import { FaTriangleExclamation, FaArrowRotateRight } from "react-icons/fa6";

export default function GlobalPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Terjadi error di halaman customer:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center relative px-6">
      <div className="shihu-glow-top" />
      <div className="shihu-glow-bottom" />

      <div className="relative z-10 w-full max-w-md text-center">
        <div className="flex justify-center mb-5">
          <div className="h-16 w-16 rounded-full bg-[#E2504A18] text-[#E2504A] flex items-center justify-center">
            <FaTriangleExclamation size={26} aria-hidden="true" />
          </div>
        </div>

        <div className="flex justify-center items-center gap-2 mb-3">
          <ShihuMark size={22} />
          <span className="font-display text-sm font-semibold text-shihu-muted">
            Shihu Service
          </span>
        </div>

        <h1 className="font-display text-xl font-bold mb-2">
          Ada yang tidak beres
        </h1>
        <p className="text-shihu-muted text-sm leading-relaxed mb-1">
          Halaman ini gagal dimuat karena ada kendala teknis di sisi kami.
        </p>
        {error.digest && (
          <p className="text-shihu-faint text-xs mb-6">Kode error: {error.digest}</p>
        )}
        {!error.digest && <div className="mb-6" />}

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-display font-semibold text-sm text-[#1A1206] bg-corona hover:opacity-90 transition-opacity"
          >
            <FaArrowRotateRight size={13} aria-hidden="true" />
            Coba lagi
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl font-display font-semibold text-sm text-shihu-muted bg-[#2C2540] hover:bg-[#332B4A] transition-colors"
          >
            Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
