import { redirect } from "next/navigation";
import Link from "next/link";
import { ShihuMark } from "@/components/ShihuMark";
import {
    getCurrentWorker,
    workerLogoutAction,
} from "@/lib/actions/worker-auth";

export default async function WorkerProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const worker = await getCurrentWorker();
    if (!worker) redirect("/worker/login");

    return (
        <div className="min-h-screen bg-shihu-bg relative">
            <div className="shihu-glow-top" />
            <header className="border-b border-shihu-border bg-shihu-card/40 relative z-10">
                <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/worker" className="flex items-center gap-2.5">
                        <ShihuMark size={26} />
                        <div>
                            <p className="font-display font-bold text-sm leading-tight">
                                Shihu Service
                            </p>
                            <p className="text-shihu-faint text-[11px]">Panel worker</p>
                        </div>
                    </Link>
                    <div className="flex items-center gap-3">
                        <p className="text-shihu-muted text-sm hidden sm:block">
                            {worker.name}
                        </p>
                        <form action={workerLogoutAction}>
                            <button
                                type="submit"
                                className="px-3 py-1.5 rounded-lg text-xs font-display font-medium text-red-400 hover:bg-red-400/10"
                            >
                                Keluar
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-8 relative z-10">
                {children}
            </main>
        </div>
    );
}
