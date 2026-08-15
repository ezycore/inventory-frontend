"use client";
// coding-standard: maintained

import { cn } from "@/ui/lib/utils";

export interface PageTab<K extends string> {
  key: K;
  label: string;
  /** Optional count rendered beside the label while the tab is active. */
  count?: number;
}

/**
 * Underlined tab strip for pages that gather related-but-separate lists under
 * one destination — Products (all / online) and Customers (all / online
 * accounts / subscribers).
 *
 * Tabs here are a navigation device, not a data one: each panel keeps its own
 * query, cursor and search term, because a page cursor from one list means
 * nothing in another.
 */
export function PageTabs<K extends string>({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: readonly PageTab<K>[];
  active: K;
  onChange: (key: K) => void;
  className?: string;
}) {
  // A single tab is just a heading with extra chrome.
  if (tabs.length < 2) return null;

  return (
    <div className={cn("flex gap-1 border-b", className)} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={cn(
              "border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {isActive && typeof tab.count === "number" ? (
              <span className="ml-1.5 font-normal tabular-nums opacity-70">
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
