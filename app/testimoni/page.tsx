import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SectionHeading } from "@/components/SectionHeading";
import { TestimoniCard } from "@/components/TestimoniCard";
import { PaginatedList } from "@/components/PaginatedList";
import { GameCountBadges } from "@/components/GameCountBadges";
import { buildOrderTitle } from "@/lib/order-display";

export const revalidate = 60;

export default async function TestimoniPage() {
  const [games, testimonials] = await Promise.all([
    prisma.game.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.testimonial.findMany({
      where: { isPublished: true },
      include: {
        game: true,
        order: {
          select: {
            completedAt: true,
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
        jokiHistoryEntry: { select: { completedAt: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const allTestimonials = testimonials
    .map((testimonial) => ({
      ...testimonial,
      completedAt: testimonial.order?.completedAt ?? testimonial.jokiHistoryEntry?.completedAt,
      jokiTitle: testimonial.order
        ? buildOrderTitle(testimonial.order.lines)
        : testimonial.jokiHistoryEntry?.title ?? "Joki history",
    }))
    .sort((a, b) => (b.completedAt?.getTime() ?? b.createdAt.getTime()) - (a.completedAt?.getTime() ?? a.createdAt.getTime()));

  const gameCounts = games.map((g) => ({
    ...g,
    count: allTestimonials.filter((t) => t.gameId === g.id).length,
  }));

  return (
    <div className="min-h-screen relative">
      <div className="shihu-glow-top" />
      <Navbar />

      <main className="site-container pb-20 pt-8 relative z-10">
        <SectionHeading
          eyebrow="Dari customer"
          title="Testimoni"
          desc="Pengalaman langsung dari customer yang sudah menggunakan jasa joki Shihu Service."
        />

        {allTestimonials.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <GameCountBadges counts={gameCounts} />
            <PaginatedList
              className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
              pageSize={12}
              items={allTestimonials.map((t) => (
                <TestimoniCard
                  key={t.id}
                  customerName={t.customerName}
                  message={t.message}
                  rating={t.rating}
                  game={t.game}
                  jokiTitle={t.jokiTitle}
                  completedAt={t.completedAt}
                />
              ))}
            />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-shihu-card border border-shihu-border rounded-2xl p-10 text-center">
      <p className="font-display font-semibold mb-1.5">Belum ada testimoni</p>
      <p className="text-shihu-muted text-sm">
        Testimoni dari customer akan tampil di sini setelah pesanan selesai.
      </p>
    </div>
  );
}