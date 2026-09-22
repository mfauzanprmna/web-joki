import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SectionHeading } from "@/components/SectionHeading";
import { GameBanner } from "@/components/GameBanner";
import { QuickAccessCard } from "@/components/QuickAccessCard";
import { TestimoniCard } from "@/components/TestimoniCard";
import { buildOrderTitle } from "@/lib/order-display";
import { FaClockRotateLeft, FaCircleCheck, FaComment, FaArrowRight } from "react-icons/fa6";

export const revalidate = 60;

export default async function HomePage() {
  const [games, testimonials] = await Promise.all([
    prisma.game.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.testimonial.findMany({
      where: { isPublished: true },
      include: {
        game: true,
        order: {
          select: {
            completedAt: true,
            customerId: true,
            lines: {
              select: {
                jokiItem: { select: { title: true } },
                jokiPaket: { select: { title: true } },
                patchEvent: { select: { title: true } },
                endgameContent: { select: { title: true } },
              },
            },
          },
        },
        jokiHistoryEntry: { select: { completedAt: true, title: true, customerId: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const sortedTestimonials = testimonials
    .map((testimonial) => ({
      ...testimonial,
      customerKey:
        testimonial.order?.customerId ??
        testimonial.jokiHistoryEntry?.customerId ??
        `name:${testimonial.customerName.trim().toLocaleLowerCase()}`,
      completedAt: testimonial.order?.completedAt ?? testimonial.jokiHistoryEntry?.completedAt,
      jokiTitle: testimonial.order
        ? buildOrderTitle(testimonial.order.lines)
        : testimonial.jokiHistoryEntry?.title ?? "Joki history",
    }))
    .sort((a, b) => (b.completedAt?.getTime() ?? b.createdAt.getTime()) - (a.completedAt?.getTime() ?? a.createdAt.getTime()));

  const homepageTestimonials = sortedTestimonials.reduce<typeof sortedTestimonials>((selected, testimonial) => {
    const existingIndex = selected.findIndex((item) => item.customerKey === testimonial.customerKey);
    if (existingIndex === -1 || testimonial.rating > selected[existingIndex].rating) {
      if (existingIndex === -1) selected.push(testimonial);
      else selected[existingIndex] = testimonial;
    }
    return selected;
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden home-grid">
      <div className="shihu-glow-top" />
      <div className="shihu-glow-bottom" />
      <Navbar />

      <main className="relative z-10">
        <section className="hero-character min-h-[560px] border-b border-shihu-border">
          <div className="site-container py-16 sm:py-20 flex items-center min-h-[500px] lg:min-h-[530px]">
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-shihu-corona/35 bg-shihu-corona/10 px-3 py-1.5 text-[11px] font-display font-semibold text-shihu-corona mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-shihu-corona" /> Joki game & game service terpercaya
              </p>
              <h1 className="font-display text-[clamp(36px,6vw,66px)] font-bold tracking-tight leading-[1.02] mb-5">
                Solusi lengkap
                <br />
                untuk kebutuhan
                <br />
                <span className="text-shihu-corona">game kamu.</span>
              </h1>
              <p className="text-shihu-muted text-[15px] max-w-md mb-8 leading-relaxed">
                Dari joki eksplorasi hingga rawat akun, semua bisa di sini.
                Proses cepat, aman, dan dikerjakan oleh tim berpengalaman.
              </p>
              <div className="flex gap-2.5 flex-wrap">
                <Link
                  href="#games"
                  className="rounded-xl font-display font-semibold text-sm text-white bg-corona shadow-lg shadow-blue-950/40"
                  style={{ padding: "12px 22px" }}
                >
                  Pilih game <FaArrowRight className="ml-1 inline text-[13px]" aria-hidden="true" />
                </Link>
                <Link
                  href="/antrian"
                  className="rounded-xl font-display font-medium text-sm border border-shihu-borderSoft text-shihu-text hover:bg-white/5"
                  style={{ padding: "12px 22px" }}
                >
                  Cek status antrian
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 max-w-2xl">
                {[["◈", "Aman & Terpercaya", "Data kamu aman"], ["ϟ", "Proses Cepat", "Sesuai estimasi"], ["♧", "Tim Profesional", "Berpengalaman"], ["✦", "Harga Terjangkau", "Kualitas tetap utama"]].map(([icon, title, desc]) => (
                  <div key={title} className="flex items-start gap-2">
                    <span className="text-shihu-corona text-lg leading-none">{icon}</span>
                    <div><p className="font-display text-[11px] font-semibold text-shihu-text">{title}</p><p className="text-[10px] text-shihu-faint mt-0.5">{desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="games" className="site-container py-12 sm:py-14 scroll-mt-20">
          <SectionHeading
            eyebrow="Pilihan layanan"
            title={<>Game & layanan <span className="text-shihu-corona">kami</span></>}
            desc="Pilih game yang kamu mainkan untuk melihat semua paket dan layanan joki yang tersedia."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-7">
            {games.map((g) => (
              <GameBanner key={g.id} game={g} tagline={g.tagline} />
            ))}
          </div>
        </section>

        <section className="border-y border-shihu-border bg-[#091727]">
          <div className="site-container py-10 sm:py-12 grid grid-cols-1 lg:grid-cols-[1.15fr_2fr] gap-8 items-center">
            <SectionHeading eyebrow="Kenapa pilih kami?" title={<>Kenapa pilih <span className="text-shihu-corona">Shihu Service?</span></>} desc="Kami berkomitmen memberikan layanan terbaik untuk pengalaman gaming kamu." />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[['◈', 'Aman & Terpercaya', 'Data dan akun kamu selalu aman'], ['ϟ', 'Proses Cepat', 'Pengerjaan sesuai estimasi'], ['✦', 'Harga Terjangkau', 'Kualitas tetap jadi prioritas'], ['♧', 'Customer Support', 'Siap membantu kapan saja']].map(([icon, title, desc]) => <div key={title} className="border-l border-shihu-border pl-4"><span className="text-shihu-corona text-xl">{icon}</span><p className="font-display text-xs font-semibold mt-2">{title}</p><p className="text-[10px] text-shihu-faint mt-1 leading-relaxed">{desc}</p></div>)}
            </div>
          </div>
        </section>

        {homepageTestimonials.length > 0 && (
          <section className="site-container py-12 sm:py-14 pb-10">
            <SectionHeading
              eyebrow="Dari customer"
              title="Testimoni"
              desc="Pengalaman customer setelah menyelesaikan order atau history joki."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {homepageTestimonials.map((testimonial) => (
                <TestimoniCard
                  key={testimonial.id}
                  customerName={testimonial.customerName}
                  message={testimonial.message}
                  rating={testimonial.rating}
                  game={testimonial.game}
                  jokiTitle={testimonial.jokiTitle}
                  completedAt={testimonial.completedAt}
                />
              ))}
            </div>
            <div className="flex justify-center mt-5">
              <Link
                href="/testimoni"
                className="px-4 py-2.5 rounded-xl font-display font-semibold text-sm border border-shihu-corona/40 text-shihu-corona hover:bg-shihu-corona/10"
              >
                Lihat semua testimoni
              </Link>
            </div>
          </section>
        )}

        <section className="site-container py-2 pb-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <QuickAccessCard
              href="/antrian"
              title="Antrian joki"
              desc="Progres pengerjaan akunmu saat ini"
              icon={<FaClockRotateLeft size={18} />}
            />
            <QuickAccessCard
              href="/history"
              title="History joki"
              desc="Riwayat joki yang sudah selesai"
              icon={<FaCircleCheck size={18} />}
            />
            <QuickAccessCard
              href="/testimoni"
              title="Testimoni"
              desc="Kata customer yang sudah pakai jasa"
              icon={<FaComment size={18} />}
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
