"use client";

import { useState } from "react";
import { Pagination } from "@/components/Pagination";
import { PatchRowItem } from "./PatchRowItem";

interface PatchListItem {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  game: { name: string; accentColor: string };
  events: {
    id: string;
    title: string;
    description: string;
    priceRupiah: number;
    startDate: Date;
    endDate: Date;
  }[];
}

type PatchTab = "ongoing" | "upcoming" | "completed";

const PAGE_SIZE = 10;

function getPatchTab(patch: PatchListItem, now: Date): PatchTab {
  if (patch.endDate < now) return "completed";
  if (patch.startDate > now) return "upcoming";
  return "ongoing";
}

export function PatchListTabs({ patches }: { patches: PatchListItem[] }) {
  const [activeTab, setActiveTab] = useState<PatchTab>("ongoing");
  const [page, setPage] = useState(1);
  const now = new Date();
  const tabs: { key: PatchTab; label: string; items: PatchListItem[] }[] = [
    {
      key: "ongoing",
      label: "Sedang berlangsung",
      items: patches.filter((patch) => getPatchTab(patch, now) === "ongoing"),
    },
    {
      key: "completed",
      label: "Sudah selesai",
      items: patches.filter((patch) => getPatchTab(patch, now) === "completed"),
    },
    {
      key: "upcoming",
      label: "Akan datang",
      items: patches.filter((patch) => getPatchTab(patch, now) === "upcoming"),
    },
  ];
  const activeItems = tabs.find((tab) => tab.key === activeTab)!.items;
  const totalPages = Math.max(1, Math.ceil(activeItems.length / PAGE_SIZE));
  const pagedItems = activeItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function selectTab(tab: PatchTab) {
    setActiveTab(tab);
    setPage(1);
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Status patch"
        className="flex gap-2 overflow-x-auto pb-2 mb-3"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            id={`patch-tab-${tab.key}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls="patch-tab-panel"
            onClick={() => selectTab(tab.key)}
            className={`shrink-0 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-display font-semibold transition-colors ${
              activeTab === tab.key
                ? "border-shihu-corona/40 bg-shihu-corona/15 text-shihu-corona"
                : "border-shihu-border text-shihu-muted hover:bg-[rgb(var(--admin-panel-soft))]"
            }`}
          >
            {tab.label}
            <span className="text-[10px] tabular-nums opacity-75">{tab.items.length}</span>
          </button>
        ))}
      </div>

      <div
        id="patch-tab-panel"
        role="tabpanel"
        aria-labelledby={`patch-tab-${activeTab}`}
        className="flex flex-col gap-3"
      >
        {pagedItems.length > 0 ? (
          pagedItems.map((patch) => <PatchRowItem key={patch.id} patch={patch} />)
        ) : (
          <p className="rounded-2xl border border-shihu-border bg-shihu-card px-4 py-6 text-center text-sm text-shihu-muted">
            Belum ada patch {activeTab === "ongoing" ? "yang sedang berlangsung" : activeTab === "upcoming" ? "yang akan datang" : "yang selesai"}.
          </p>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
