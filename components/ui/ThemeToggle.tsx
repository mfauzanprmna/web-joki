"use client";

import { useEffect, useState } from "react";
import { FaSun, FaMoon } from "react-icons/fa6";

export const THEME_STORAGE_KEY = "shihu-theme";

/**
 * Tombol ganti mode gelap/terang. Bacaan tema AWAL disinkronkan dari
 * `document.documentElement`'s `data-theme` (yang sudah diset lebih dulu
 * oleh script anti-flash di app/layout.tsx, sebelum React sempat hydrate),
 * bukan langsung baca localStorage di sini -- supaya kedua sumber selalu
 * konsisten satu sama lain.
 *
 * Sebelum mount, komponen ini render tombol placeholder netral (disabled,
 * tanpa ikon spesifik) supaya HTML dari server & client pertama kali persis
 * sama (server tidak tahu preferensi tema browser/localStorage pengguna) --
 * menghindari hydration mismatch. Begitu useEffect jalan di client, ikon
 * yang benar langsung muncul.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"dark" | "light" | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    setTheme(current);
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // localStorage bisa gagal (mis. private browsing ketat di sebagian
      // browser) -- tema tetap berubah untuk sesi ini, cuma tidak
      // tersimpan untuk kunjungan berikutnya.
    }
  }

  if (theme === null) {
    return (
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        disabled
        className={`w-9 h-9 rounded-xl border border-shihu-border shrink-0 ${className}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "light" ? "Ganti ke mode gelap" : "Ganti ke mode terang"}
      title={theme === "light" ? "Mode terang aktif — klik untuk mode gelap" : "Mode gelap aktif — klik untuk mode terang"}
      className={`w-9 h-9 rounded-xl border border-shihu-border shrink-0 flex items-center justify-center text-shihu-muted hover:text-shihu-corona hover:border-shihu-corona/40 transition-colors ${className}`}
    >
      {theme === "light" ? (
        <FaSun className="text-[14px]" aria-hidden="true" />
      ) : (
        <FaMoon className="text-[14px]" aria-hidden="true" />
      )}
    </button>
  );
}
