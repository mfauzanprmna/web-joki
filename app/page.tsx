import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ShihuMark } from "@/components/ShihuMark";
import { SectionHeading } from "@/components/SectionHeading";
import { GameBanner } from "@/components/GameBanner";
import { QuickAccessCard } from "@/components/QuickAccessCard";

export const revalidate = 60;

export default async function HomePage() {
  const games = await prisma.game.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="min-h-screen relative">
      <div className="shihu-glow-top" />
      <div className="shihu-glow-bottom" />
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 pb-20 relative z-10">
        <section className="pt-14 pb-10 text-center">
          <div className="flex justify-center mb-5">
            <ShihuMark size={64} />
          </div>
          <h1 className="font-display text-[clamp(32px,5vw,48px)] font-bold tracking-tight leading-[1.1] mb-3.5">
            Joki game yang jelas prosesnya,
            <br />
            bukan yang menghilang saat dibutuhkan
          </h1>
          <p className="text-shihu-muted text-[15.5px] max-w-md mx-auto mb-7 leading-relaxed">
            Pantau antrian secara langsung, lihat siapa yang mengerjakan
            akunmu, dan cek riwayat joki yang sudah selesai — semua dalam
            satu tempat.
          </p>
          <div className="flex gap-2.5 justify-center flex-wrap">
            <Link
              href="/joki"
              className="px-5.5 py-3 rounded-xl font-display font-semibold text-sm text-[#1A1206] bg-corona"
              style={{ padding: "12px 22px" }}
            >
              Lihat list joki
            </Link>
            <Link
              href="/antrian"
              className="rounded-xl font-display font-medium text-sm border border-shihu-borderSoft text-shihu-text"
              style={{ padding: "12px 22px" }}
            >
              Cek status antrian
            </Link>
          </div>
        </section>

        <section className="py-5 pb-12">
          <SectionHeading
            eyebrow="Game yang tersedia"
            title="Pilih game kamu"
            desc="Setiap game punya tim joki berpengalaman sendiri, sesuai karakteristik masing-masing."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((g) => (
              <GameBanner key={g.id} game={g} tagline={g.tagline} />
            ))}
          </div>
        </section>

        <section className="py-2 pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <QuickAccessCard
              href="/joki"
              title="List joki"
              desc="Semua paket layanan joki per game"
              icon={<IconList />}
            />
            <QuickAccessCard
              href="/antrian"
              title="Antrian joki"
              desc="Progres pengerjaan akunmu saat ini"
              icon={<IconClock />}
            />
            <QuickAccessCard
              href="/history"
              title="History joki"
              desc="Riwayat joki yang sudah selesai"
              icon={<IconCheck />}
            />
            <QuickAccessCard
              href="/testimoni"
              title="Testimoni"
              desc="Kata customer yang sudah pakai jasa"
              icon={<IconChat />}
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function IconList() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function IconChat() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  );
}
