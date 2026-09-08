"use client";

import { useState } from "react";

export function CopyLinkBox({ label, path }: { label: string; path: string }) {
    const [copied, setCopied] = useState(false);

    function copy() {
        const url = `${window.location.origin}${path}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    return (
        <div className="flex items-center gap-2 justify-between flex-wrap">
            <p className="text-shihu-faint text-xs">
                {label}: <span className="text-shihu-corona font-display">{path}</span>
            </p>
            <button
                onClick={copy}
                className="px-3 py-1.5 rounded-lg text-xs font-display font-medium border border-shihu-borderSoft text-shihu-text hover:bg-[#2C2540] shrink-0"
            >
                {copied ? "Disalin!" : "Salin link"}
            </button>
        </div>
    );
}