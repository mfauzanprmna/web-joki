import { prisma } from "@/lib/prisma";
import { createTestimonial } from "@/lib/actions/testimonial";
import { TestimonialRowItem } from "@/components/admin/TestimonialRowItem";

export default async function AdminTestimoniPage() {
  const [games, testimonials] = await Promise.all([
    prisma.game.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.testimonial.findMany({
      include: { game: true },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-1">Kelola testimoni</h1>
      <p className="text-shihu-muted text-sm mb-6">
        Tambah testimoni manual, sembunyikan yang tidak relevan, atau hapus.
      </p>

      <details className="bg-shihu-card border border-shihu-border rounded-2xl p-5 mb-7 group">
        <summary className="font-display text-sm font-semibold cursor-pointer list-none flex items-center justify-between">
          Tambah testimoni baru
          <span className="text-shihu-corona text-xs group-open:rotate-45 transition-transform">
            +
          </span>
        </summary>

        <form action={createTestimonial} className="flex flex-col gap-3 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
                Game
              </label>
              <select name="gameId" required className="admin-input">
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
                Rating (1-5)
              </label>
              <input
                type="number"
                name="rating"
                min={1}
                max={5}
                defaultValue={5}
                required
                className="admin-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
              Nama customer
            </label>
            <input name="customerName" required className="admin-input" placeholder="Rafi A." />
          </div>

          <div>
            <label className="block text-[11.5px] font-display font-medium text-shihu-muted mb-1">
              Pesan testimoni
            </label>
            <textarea
              name="message"
              required
              rows={2}
              className="admin-input"
              placeholder="Prosesnya rapi, ada update progress terus."
            />
          </div>

          <button
            type="submit"
            className="self-start px-5 py-2.5 rounded-xl font-display font-semibold text-sm text-[#1A1206] bg-corona mt-1"
          >
            Tambah testimoni
          </button>
        </form>
      </details>

      <div className="flex flex-col gap-2.5">
        {testimonials.map((t) => (
          <TestimonialRowItem key={t.id} item={t} />
        ))}
      </div>
    </div>
  );
}
