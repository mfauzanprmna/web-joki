"use client";

interface PaginationProps {
    page: number; // 1-based
    totalPages: number;
    onPageChange: (page: number) => void;
}

function pageNumbersToShow(page: number, totalPages: number): (number | "...")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
    const sorted = Array.from(pages)
        .filter((p) => p >= 1 && p <= totalPages)
        .sort((a, b) => a - b);

    const result: (number | "...")[] = [];
    let prev = 0;
    for (const p of sorted) {
        if (prev && p - prev > 1) result.push("...");
        result.push(p);
        prev = p;
    }
    return result;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-1.5 mt-4">
            <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="px-2.5 py-1.5 rounded-lg text-xs font-display font-medium border border-shihu-border text-shihu-muted hover:bg-[#2C2540] disabled:opacity-40 disabled:hover:bg-transparent"
            >
                ← Prev
            </button>

            {pageNumbersToShow(page, totalPages).map((p, i) =>
                p === "..." ? (
                    <span key={`dots-${i}`} className="px-1.5 text-xs text-shihu-faint">
                        …
                    </span>
                ) : (
                    <button
                        key={p}
                        type="button"
                        onClick={() => onPageChange(p)}
                        className={`min-w-[30px] px-2.5 py-1.5 rounded-lg text-xs font-display font-medium border ${p === page
                                ? "bg-shihu-corona/15 border-shihu-corona/40 text-shihu-corona"
                                : "border-shihu-border text-shihu-muted hover:bg-[#2C2540]"
                            }`}
                    >
                        {p}
                    </button>
                )
            )}

            <button
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-2.5 py-1.5 rounded-lg text-xs font-display font-medium border border-shihu-border text-shihu-muted hover:bg-[#2C2540] disabled:opacity-40 disabled:hover:bg-transparent"
            >
                Next →
            </button>
        </div>
    );
}