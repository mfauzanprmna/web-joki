interface CountProgressViewProps {
    title: string;
    current: number;
    target: number | null;
    unitLabel: string;
}

export function CountProgressView({ title, current, target, unitLabel }: CountProgressViewProps) {
    const percent = target && target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

    return (
        <div className="bg-[#241E38] border border-shihu-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
                <p className="font-display text-sm font-semibold">{title}</p>
                <span className="text-shihu-corona font-display text-sm font-bold">
                    {current} / {target ?? "?"} {unitLabel}
                </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-shihu-border overflow-hidden">
                <div className="h-full bg-corona transition-all" style={{ width: `${percent}%` }} />
            </div>
        </div>
    );
}