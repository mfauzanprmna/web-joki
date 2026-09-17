export function ShihuMark({
  size = 28,
  accent = "#4D9CFF",
}: {
  size?: number;
  accent?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        d="M20 1.5L24.3 15.7L38.5 20L24.3 24.3L20 38.5L15.7 24.3L1.5 20L15.7 15.7L20 1.5Z"
        fill={accent}
      />
      <path
        d="M20 7L22.7 17.3L33 20L22.7 22.7L20 33L17.3 22.7L7 20L17.3 17.3L20 7Z"
        fill="#F4F8FF"
      />
      <path d="M20 12L21.8 18.2L28 20L21.8 21.8L20 28L18.2 21.8L12 20L18.2 18.2L20 12Z" fill={accent} />
    </svg>
  );
}
