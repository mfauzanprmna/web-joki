export function SectionHeading({
  eyebrow,
  title,
  desc,
}: {
  eyebrow?: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <p className="text-shihu-corona text-sm font-medium font-display mb-1.5">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-[26px] font-semibold tracking-tight mb-2">
        {title}
      </h2>
      {desc && (
        <p className="text-shihu-muted text-[14.5px] leading-relaxed max-w-xl">
          {desc}
        </p>
      )}
    </div>
  );
}
