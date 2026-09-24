"use client";
// coding-standard: maintained

import { Search } from "lucide-react";
import { Input } from "@/ui/components/input";
import { cn } from "@/ui/lib/utils";

export type PagesFilter = "all" | "content" | "landing" | "campaign";

/**
 * Which kinds of page the list shows, and a search over them.
 *
 * Pills rather than tabs: on a phone they scroll sideways as one row, and a
 * merchant with three pages reads the counts at a glance instead of opening
 * each tab to find out.
 */
export function PagesFilterBar({
  filter,
  onFilter,
  counts,
  search,
  onSearch,
}: {
  filter: PagesFilter;
  onFilter: (next: PagesFilter) => void;
  /** Kinds with no count are not offered — a store with no campaign pages gets no Campaign pill. */
  counts: Partial<Record<PagesFilter, number>>;
  search: string;
  onSearch: (next: string) => void;
}) {
  const pills: { id: PagesFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "landing", label: "Landing" },
    { id: "campaign", label: "Campaign" },
    { id: "content", label: "Store pages" },
  ];

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <div
        role="group"
        aria-label="Show pages"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]! md:mx-0 md:flex-1 md:px-0"
      >
        {pills
          .filter((pill) => counts[pill.id] !== undefined)
          .map((pill) => {
            const active = pill.id === filter;
            return (
              <button
                key={pill.id}
                type="button"
                aria-pressed={active}
                onClick={() => onFilter(pill.id)}
                className={cn(
                  "flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card text-foreground hover:bg-muted",
                )}
              >
                {pill.label}
                <span className={cn("text-xs", active ? "text-primary-foreground/80" : "text-muted-foreground")}>
                  {counts[pill.id]}
                </span>
              </button>
            );
          })}
      </div>
      <div className="relative md:w-64">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search pages"
          aria-label="Search pages"
          className="h-11 pl-9 md:h-9"
        />
      </div>
    </div>
  );
}
