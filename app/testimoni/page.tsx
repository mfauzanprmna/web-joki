import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SectionHeading } from "@/components/SectionHeading";
import { TestimoniCard } from "@/components/TestimoniCard";

export const revalidate = 60;

export default async function TestimoniPage() {
  const testimonials = await prisma.testimonial.findMany({
    where: { isPublished: true },
    include: { game: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

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

        {testimonials.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {testimonials.map((t) => (
              <TestimoniCard
                key={t.id}
                customerName={t.customerName}
                message={t.message}
                rating={t.rating}
                game={t.game}
              />
            ))}
          </div>
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
