"use client";
// coding-standard: maintained

import { useState, type ReactNode } from "react";
import { FileText, Megaphone, Plus, Tag } from "lucide-react";
import { useStorefrontPages, type StorefrontPageListItem } from "@/services/api";
import { useAuthStore } from "@/services/stores";
import { Skeleton } from "@/ui/components/skeleton";
import { Button } from "@/ui/components/button";
import { STORE_PAGE_STARTERS, type NewPageStart } from "./new-page-dialog";
import { PageRow } from "./page-row";
import { PagesFilterBar, type PagesFilter } from "./pages-filter-bar";

/**
 * The backend's list cap (`MAX_LIST_LIMIT`). The list does not page: a store with
 * more than this of one kind sees the 100 edited most recently.
 */
const LIST_LIMIT = 100;

interface Group {
  id: Exclude<PagesFilter, "all">;
  title: string;
  hint: string;
  icon: ReactNode;
  pages: StorefrontPageListItem[];
  /** Shown instead of rows when the kind has none; a kind with no empty state is left out. */
  empty?: ReactNode;
}

const ICON = "h-[18px] w-[18px]";

const matches = (page: StorefrontPageListItem, query: string) =>
  !query || page.title.toLowerCase().includes(query) || (page.slug ?? "").includes(query);

/**
 * Every page a merchant makes or is given, as one grouped list: landing pages,
 * campaign pages (once a campaign has one) and store pages.
 *
 * It replaced two DataTables and a card (2026-09-23). A table per kind drew three
 * visual languages down one screen and, on a phone, three sideways-scrolling
 * grids; one row shape reads the same at every width.
 *
 * **Store pages are always drawn**, empty included: the merchant with none is the
 * one who most needs to see that the shop has a place for them, so the empty state
 * offers the usual ones as one-tap starts.
 */
export function PagesList({ onCreate }: { onCreate: (start: NewPageStart) => void }) {
  const storeSlug = useAuthStore((s) => s.user?.organization?.slug);
  const [filter, setFilter] = useState<PagesFilter>("all");
  const [search, setSearch] = useState("");
  const store = useStorefrontPages({ kind: "content", limit: LIST_LIMIT });
  const landing = useStorefrontPages({ kind: "landing", limit: LIST_LIMIT });
  const campaign = useStorefrontPages({ kind: "campaign", limit: LIST_LIMIT });
  const loading = store.isLoading || landing.isLoading || campaign.isLoading;

  const query = search.trim().toLowerCase();
  // Ordered by how often a merchant works in each: landing pages are where ads
  // send shoppers and orders come from; campaign pages matter around a sale;
  // store pages are written once and rarely reopened.
  const groups: Group[] = [
    {
      id: "landing",
      title: "Landing pages",
      hint: "For ads · hidden from Google",
      icon: <Megaphone className={ICON} />,
      pages: landing.data?.items ?? [],
      empty: (
        <div className="flex flex-col items-start gap-3 p-4 md:flex-row md:items-center">
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Running ads? Send them to a landing page.</span>
            <span className="block text-sm text-muted-foreground">
              One product or one offer, its own link, and a count of the orders it brings in.
            </span>
          </span>
          <Button className="h-11 md:h-9" onClick={() => onCreate({ kind: "landing" })}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden />
            Make a page for your next ad
          </Button>
        </div>
      ),
    },
    {
      // No empty state: most stores never make a campaign page, and the group
      // would only say so. It appears with the first one.
      id: "campaign",
      title: "Campaign pages",
      hint: "One per sale · deleted with its campaign",
      icon: <Tag className={ICON} />,
      pages: campaign.data?.items ?? [],
    },
    {
      id: "content",
      title: "Store pages",
      hint: "In your footer · found by Google",
      icon: <FileText className={ICON} />,
      pages: store.data?.items ?? [],
      empty: (
        <div className="space-y-3 p-4">
          <p className="text-sm font-semibold">No store pages yet</p>
          <p className="text-sm text-muted-foreground">
            Shoppers look for these before they trust a new shop. Tap one to start it — the words are yours
            to write.
          </p>
          <div className="flex flex-wrap gap-2">
            {STORE_PAGE_STARTERS.map((title) => (
              <button
                key={title}
                type="button"
                onClick={() => onCreate({ kind: "content", title })}
                className="flex h-10 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3.5 text-sm font-medium text-primary hover:bg-primary/10"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                {title}
              </button>
            ))}
          </div>
        </div>
      ),
    },
  ];

  const counts: Partial<Record<PagesFilter, number>> = {
    all: groups.reduce((sum, group) => sum + group.pages.length, 0),
  };
  for (const group of groups) {
    if (group.pages.length > 0 || group.empty) counts[group.id] = group.pages.length;
  }

  const shown = groups
    .filter((group) => filter === "all" || filter === group.id)
    .map((group) => ({ ...group, pages: group.pages.filter((page) => matches(page, query)) }))
    .filter((group) => group.pages.length > 0 || (!query && group.empty));

  return (
    <section aria-label="Your pages" className="space-y-3 md:space-y-0 md:overflow-hidden md:rounded-xl md:border md:bg-card">
      <div className="md:border-b md:px-4 md:py-3">
        <PagesFilterBar
          filter={filter}
          onFilter={setFilter}
          counts={counts}
          search={search}
          onSearch={setSearch}
        />
      </div>

      {/* Mirrors PageRow's desktop columns: icon, the three-column link, the ⋯ button. */}
      <div
        aria-hidden
        className="hidden items-center gap-3 border-b bg-muted/40 py-2 pl-4 pr-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:flex"
      >
        <span className="w-10 shrink-0" />
        <span className="grid flex-1 grid-cols-[minmax(0,1fr)_10rem_9rem] gap-4">
          <span>Page</span>
          <span>Status</span>
          <span>Last edited</span>
        </span>
        <span className="w-9 shrink-0" />
      </div>

      {loading ? (
        <div className="space-y-2 md:p-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : shown.length === 0 ? (
        <p className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground md:rounded-none md:border-0">
          No page matches “{search.trim()}”.
        </p>
      ) : (
        shown.map((group) => (
          <div key={group.id} className="pt-3 md:border-t md:pt-0 md:first:border-t-0">
            <div className="flex items-baseline gap-2 px-1 pb-2 md:px-4 md:pb-1 md:pt-4">
              <h2 className="shrink-0 text-base font-semibold md:text-sm">{group.title}</h2>
              <span className="truncate text-[13px] text-muted-foreground">{group.hint}</span>
            </div>
            <div className="overflow-hidden rounded-xl border bg-card md:rounded-none md:border-0">
              {group.pages.length > 0 ? (
                <ul className="divide-y">
                  {group.pages.map((page) => (
                    <PageRow
                      key={page._id}
                      page={page}
                      icon={group.icon}
                      storeSlug={storeSlug}
                      showOrders={group.id === "landing"}
                    />
                  ))}
                </ul>
              ) : (
                group.empty
              )}
            </div>
          </div>
        ))
      )}
    </section>
  );
}
