interface GameCount {
    id: string;
    name: string;
    accentColor: string;
    count: number;
}

export function GameCountBadges({ counts }: { counts: GameCount[] }) {
    const withData = counts.filter((c) => c.count > 0);
    if (withData.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 mb-4">
            {withData.map((c) => (
                <span
                    key={c.id}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-display font-medium"
                    style={{
                        backgroundColor: `${c.accentColor}1F`,
                        color: c.accentColor,
                        border: `1px solid ${c.accentColor}55`,
                    }}
                >
                    <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.accentColor }} />
                    {c.name}: {c.count}
                </span>
            ))}
        </div>
    );
}