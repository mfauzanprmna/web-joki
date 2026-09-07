export function ShihuMark({
  size = 28,
  accent = "#FFB238",
}: {
  size?: number;
  accent?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="17" stroke={accent} strokeWidth="1.4" opacity="0.55" />
      <circle cx="20" cy="20" r="12.5" fill="#15111F" stroke={accent} strokeWidth="1" />
      <circle cx="16.5" cy="20" r="12.5" fill="#15111F" />
    </svg>
  );
}
