"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Menampilkan progress bar tipis di bagian atas layar setiap kali route
 * berpindah (mirip transisi loading di banyak website modern), supaya user
 * dapat feedback visual walau perpindahan halaman berlangsung cepat.
 *
 * Next.js App Router tidak mengekspos event "navigasi mulai/selesai" secara
 * langsung, jadi kita mendeteksi klik pada <a> internal untuk memicu status
 * "loading", lalu otomatis mematikannya begitu pathname/searchParams
 * berubah (artinya render halaman baru sudah selesai).
 */
function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const minDurationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef<number>(0);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }

      // Hanya untuk navigasi internal ke origin yang sama.
      if (url.origin !== window.location.origin) return;

      const isSamePage =
        url.pathname === window.location.pathname && url.search === window.location.search;
      if (isSamePage) return;

      startedAt.current = Date.now();
      setIsNavigating(true);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    // Setiap kali pathname/searchParams berubah, anggap navigasi selesai.
    // Beri jeda minimum kecil supaya bar tidak "berkedip" untuk transisi
    // yang sangat instan.
    if (!isNavigating) return;

    const elapsed = Date.now() - startedAt.current;
    const remaining = Math.max(0, 250 - elapsed);

    if (minDurationTimer.current) clearTimeout(minDurationTimer.current);
    minDurationTimer.current = setTimeout(() => setIsNavigating(false), remaining);

    return () => {
      if (minDurationTimer.current) clearTimeout(minDurationTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  if (!isNavigating) return null;

  return (
    <div className="shihu-topbar" aria-hidden="true">
      <div className="shihu-topbar-fill" />
    </div>
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}
