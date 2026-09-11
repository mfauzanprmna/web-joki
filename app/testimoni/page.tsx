import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SectionHeading } from "@/components/SectionHeading";
import { TestimoniCard } from "@/components/TestimoniCard";
import { PaginatedList } from "@/components/PaginatedList";
import { GameCountBadges } from "@/components/GameCountBadges";

export const revalidate = 60;

export default async function TestimoniPage() {
  const [games, testimonials] = await Promise.all([
    prisma.game.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.testimonial.findMany({
      where: { isPublished: true },
      include: {
        game: true,
        order: { select: { customerId: true } },
        jokiHistoryEntry: { select: { customerId: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const bestTestimonials = testimonials.reduce<typeof testimonials>((selected, testimonial) => {
    const customerKey =
      testimonial.order?.customerId ??
      testimonial.jokiHistoryEntry?.customerId ??
      `name:${testimonial.customerName.trim().toLocaleLowerCase()}`;
    const existingIndex = selected.findIndex((item) => {
      const itemKey =
        item.order?.customerId ??
        item.jokiHistoryEntry?.customerId ??
        `name:${item.customerName.trim().toLocaleLowerCase()}`;
      return itemKey === customerKey;
    });

    if (existingIndex === -1) {
      selected.push(testimonial);
    } else {
      const existing = selected[existingIndex];
      if (testimonial.rating > existing.rating) {
        selected[existingIndex] = testimonial;
      }
    }

    return selected;
  }, []);

  const gameCounts = games.map((g) => ({
    ...g,
    count: bestTestimonials.filter((t) => t.gameId === g.id).length,
  }));

  return (
    <div className="min-h-screen relative">
      <div className="shihu-glow-top" />
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 pb-20 pt-8 relative z-10">
        <SectionHeading
          eyebrow="Dari customer"
          title="Testimoni"
          desc="Pengalaman langsung dari customer yang sudah menggunakan jasa joki Shihu Service."
        />

        {bestTestimonials.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <GameCountBadges counts={gameCounts} />
            <PaginatedList
              className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
              pageSize={12}
              items={bestTestimonials.map((t) => (
                <TestimoniCard
                  key={t.id}
                  customerName={t.customerName}
                  message={t.message}
                  rating={t.rating}
                  game={t.game}
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