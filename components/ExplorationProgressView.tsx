interface ExplorationProgressViewProps {
    title: string;
    percent: number;
}

export function ExplorationProgressView({ title, percent }: ExplorationProgressViewProps) {
    return (
        <div className="bg-[#241E38] border border-shihu-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
                <p className="font-display text-sm font-semibold">{title}</p>
                <span className="text-shihu-corona font-display text-sm font-bold">{percent}% dieksplor</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-shihu-border overflow-hidden">
                <div className="h-full bg-corona transition-all" style={{ width: `${percent}%` }} />
            </div>
        </div>
    );
}