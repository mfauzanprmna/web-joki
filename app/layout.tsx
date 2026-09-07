import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="font-body antialiased bg-shihu-bg text-shihu-text min-h-screen">
        {children}
      </body>
    </html>
  );
}
