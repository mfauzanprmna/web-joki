export function RingProgress({
  value,
  accent,
  size = 56,
}: {
  value: number;
  accent: string;
  size?: number;
}) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Progres ${value} persen`}
    >
      <svg width={size} height={size} viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#362D4C" strokeWidth="4" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth="4"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-display text-xs font-semibold text-shihu-text">
        {value}%
      </div>
    </div>
  );
}
