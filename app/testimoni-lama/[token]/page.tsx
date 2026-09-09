import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SectionHeading } from "@/components/SectionHeading";
import { GameBadge } from "@/components/GameBadge";
import { JokiHistoryTestimonialForm } from "@/components/JokiHistoryTestimonialForm";
import { formatDate } from "@/lib/format";

export const revalidate = 0;

export default async function JokiHistoryTestimonialPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;

    const entry = await prisma.jokiHistoryEntry.findUnique({
        where: { shareToken: token },
        include: { game: true, customer: { select: { name: true } }, testimonial: true },
    });

    if (!entry) notFound();

    return (
        <div className="min-h-screen relative">
            <div className="shihu-glow-top" />
            <Navbar />

            <main className="max-w-lg mx-auto px-6 pb-20 pt-8 relative z-10">
                <SectionHeading
                    eyebrow="Terima kasih sudah pakai jasa kami"
                    title={entry.title}
                    desc={`Joki untuk ${entry.customer.name} · selesai ${formatDate(entry.completedAt)}.`}
                />

                <div className="bg-shihu-card border border-shihu-border rounded-2xl p-5 mb-6 flex items-center justify-between flex-wrap gap-2">
                    <GameBadge game={entry.game} />
                    {entry.jokerName && (
                        <p className="text-shihu-muted text-xs">
                            Dikerjakan oleh: {entry.jokerName}
                        </p>
                    )}
                </div>

                <JokiHistoryTestimonialForm
                    shareToken={entry.shareToken}
                    defaultCustomerName={entry.customer.name}
                    existing={
                        entry.testimonial
                            ? {
                                rating: entry.testimonial.rating,
                                message: entry.testimonial.message,
                                isPublished: entry.testimonial.isPublished,
                            }
                            : null
                    }
                />
            </main>

            <Footer />
        </div>
    );
}
