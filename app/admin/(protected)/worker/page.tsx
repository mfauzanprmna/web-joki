import { prisma } from "@/lib/prisma";
import { CreateWorkerForm } from "@/components/admin/CreateWorkerForm";
import { WorkerRowItem } from "@/components/admin/WorkerRowItem";

export default async function AdminWorkerPage() {
    const workers = await prisma.worker.findMany({
        include: { _count: { select: { orders: true } } },
        orderBy: { createdAt: "asc" },
    });

    return (
        <div>
            <h1 className="font-display text-2xl font-bold mb-1">Akun worker</h1>
            <p className="text-shihu-muted text-sm mb-6">
                Kelola akun login untuk joki/worker. Worker yang login cuma bisa lihat & update progres pesanan
                yang ditugaskan ke akunnya sendiri (lewat dropdown &ldquo;Worker&rdquo; di halaman Pesanan), lengkap
                dengan info komisi 80% dari harga tiap pesanan.
            </p>

            <details className="bg-shihu-card border border-shihu-border rounded-2xl p-5 mb-7 group" open={workers.length === 0}>
                <summary className="font-display text-sm font-semibold cursor-pointer list-none flex items-center justify-between">
                    Tambah akun worker
                    <span className="text-shihu-corona text-xs group-open:rotate-45 transition-transform">+</span>
                </summary>

                <CreateWorkerForm />
            </details>

            {workers.length === 0 ? (
                <div className="bg-shihu-card border border-shihu-border rounded-2xl p-10 text-center">
                    <p className="font-display font-semibold mb-1.5">Belum ada akun worker</p>
                    <p className="text-shihu-muted text-sm">Tambahkan lewat form di atas.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-2.5">
                    {workers.map((w) => (
                        <WorkerRowItem
                            key={w.id}
                            item={{ id: w.id, name: w.name, username: w.username, isActive: w.isActive, orderCount: w._count.orders }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}