import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { SweetAlertProvider } from "@/components/ui/SweetAlertProvider";
import { NavigationProgress } from "@/components/ui/NavigationProgress";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Shihu Service — Joki Game Terpercaya",
  description:
    "Jasa joki game untuk Genshin Impact, Wuthering Waves, dan Neverness to Everness. Pantau antrian, lihat history, dan baca testimoni customer secara langsung.",
};

// Dijalankan sinkron di <head>, SEBELUM body dirender/React hydrate, supaya
// tema yang benar (dari localStorage, atau preferensi sistem kalau belum
// pernah diset) langsung terpasang tanpa sempat kelihatan sekilas versi
// gelap default dulu baru "loncat" ke terang (flash of wrong theme).
// data-theme="dark" di <html> di bawah adalah fallback SSR (server tidak
// tahu preferensi browser pengguna) -- script ini yang mengoreksinya di
// client sebelum sempat ke-paint.
const themeInitScript = `(function(){try{var t=localStorage.getItem('shihu-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-theme="dark" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-body antialiased bg-shihu-bg text-shihu-text min-h-screen">
        <SweetAlertProvider>
          <NavigationProgress />
          {children}
        </SweetAlertProvider>
      </body>
    </html>
  );
}
