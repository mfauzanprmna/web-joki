interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 22, className = "" }: SpinnerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-shihu-spin ${className}`}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="3"
      />
      <path
        d="M21.5 12a9.5 9.5 0 00-9.5-9.5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Spinner + label penuh satu layar, dipakai di `loading.tsx` tiap route
 * segment supaya perpindahan antar halaman terasa seperti web yang
 * "responsif" — muncul indikator alih-alih layar kosong/putih.
 */
export function PageLoader({ label = "Memuat halaman..." }: { label?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3.5 text-shihu-corona">
      <Spinner size={34} />
      <p className="text-shihu-muted text-sm font-display">{label}</p>
    </div>
  );
}
