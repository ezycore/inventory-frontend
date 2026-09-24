"use client";
// coding-standard: maintained

import { useState, type ReactNode } from "react";
import { useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";
import { resolveTemplates } from "@/lib/storefront-templates";
import { SideDrawer } from "@/components/storefront/side-drawer";
import { FilterPanel } from "@/components/storefront/filter-panel";
import {
  FilterChips,
  FiltersButton,
  SortSelect,
} from "@/components/storefront/filter-toolbar";
import { Icon } from "@/components/storefront/sf-icons";
import { FilterBar } from "@/components/storefront/filters/filter-bar";
import { QuickChips } from "@/components/storefront/filters/quick-chips";
import { SortSheet } from "@/components/storefront/filters/sort-sheet";
import { useHideOnScroll } from "@/components/storefront/filters/use-hide-on-scroll";
import type { FilterContext } from "@/components/storefront/filters/filter-group-body";
import type { CatalogFacets } from "@/components/storefront/use-catalog-facets";
import {
  orderFilterGroups,
  visibleSorts,
  type ResolvedFilterSettings,
} from "@/lib/storefront-filters";
import { brandButton } from "@/lib/storefront-button";

/**
 * Everything around a catalogue grid that filters or sorts it — the toolbar,
 * the quick chips, the active chips, the sheet/drawer, the desktop sidebar or
 * bar — for the collection, campaign and search pages alike. One component so
 * the three pages cannot drift on what a filter looks like or does.
 *
 * Which surface draws is CSS, never a `matchMedia` read (the page is
 * server-rendered): the sidebar only exists from 1024px, the bar from the
 * storefront breakpoint, and the Filters button is hidden exactly where one of
 * them takes over.
 */
export function CatalogFilters({
  facets,
  settings,
  total,
  categoryNav,
  hideCategory,
  hideCount,
  children,
}: {
  facets: CatalogFacets;
  settings: ResolvedFilterSettings;
  /** Live result count — the toolbar's and the sheet button's number. */
  total: number;
  /** See `FilterContext.categoryNav`. */
  categoryNav: boolean;
  /** A category page: the collection is the route, not a facet. */
  hideCategory: boolean;
  /** The merchant hid the result count (`collection-grid` section setting). */
  hideCount?: boolean;
  /** The grid and whatever follows it (pager, load-more). */
  children: ReactNode;
}) {
  const { t } = useStorefrontUI();
  const { slug } = useStoreContext();
  const { data: store } = useStore(slug);
  // Draft first, like `StoreShell` — the preview may be showing the other shell.
  const shell = useSfPreview((s) => s.shell) || resolveTemplates(store).shell;
  const [panelOpen, setPanelOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const { enabled, desktop, mobile } = settings;
  const hidden = useHideOnScroll(mobile.stickyBar);
  const groups = orderFilterGroups({
    facets: facets.data,
    settings,
    hideCategory,
    inStockActive: facets.filters.inStock,
    active: facets.activeGroups,
  });
  const ctx: FilterContext = { facets, settings, categoryNav };
  const sorts = visibleSorts(settings);
  const placement = enabled ? desktop.placement : "drawer";
  // Under the category-sidebar shell the page already has a left column; the
  // filters take the right one instead (owner decision C).
  const sidebarSide = shell === "rail" ? "right" : "left";

  const toolbarClass = [
    "sf-ftool",
    mobile.stickyBar ? "sf-ftool-sticky" : "",
    hidden ? "sf-ftool-hidden" : "",
  ]
    .filter(Boolean)
    .join(" ");
  // The Filters button yields to whichever desktop surface is showing the groups.
  const buttonClass =
    placement === "sidebar" ? "sf-hide-wide" : placement === "bar" ? "sf-mobile-only" : undefined;

  const panel = <FilterPanel groups={groups} ctx={ctx} />;

  return (
    <>
      <div className={toolbarClass}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          {enabled && groups.length > 0 ? (
            <FiltersButton
              className={buttonClass}
              activeCount={facets.chips.length}
              onClick={() => setPanelOpen(true)}
            />
          ) : null}
          {enabled && placement === "bar" ? (
            <FilterBar className="sf-desktop-only" groups={groups} ctx={ctx} />
          ) : null}
          <button
            type="button"
            className="sf-mobile-only sf-fsort-btn"
            aria-haspopup="dialog"
            onClick={() => setSortOpen(true)}
          >
            <Icon name="sliders" size={15} />
            {t.sortLabel}
          </button>
          {hideCount ? null : (
            <span className="sf-mobile-only" style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>
              {total} {t.results}
            </span>
          )}
        </div>
        <SortSelect
          className="sf-desktop-only"
          sort={facets.sort}
          options={sorts}
          onChange={facets.setSort}
        />
      </div>

      {enabled ? <QuickChips groups={groups} ctx={ctx} /> : null}
      {enabled ? <FilterChips chips={facets.chips} onClearAll={facets.clearAll} /> : null}

      {enabled && placement === "sidebar" ? (
        <div className={`sf-flayout sf-flayout-${sidebarSide}`}>
          <aside className="sf-flayout-aside" aria-label={t.filters}>
            {panel}
          </aside>
          <div style={{ minWidth: 0 }}>{children}</div>
        </div>
      ) : (
        children
      )}

      <SideDrawer
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        side={mobile.entry === "sheet" ? "sheet" : "right"}
        title={t.filters}
        headerAccessory={
          facets.chips.length > 0 ? (
            <button
              type="button"
              onClick={facets.clearAll}
              style={{ fontSize: 12, fontWeight: 600, fontFamily: "inherit", color: "var(--muted)", background: "none", border: "none", textDecoration: "underline", cursor: "pointer" }}
            >
              {t.reset}
            </button>
          ) : undefined
        }
        footer={
          <button
            type="button"
            onClick={() => setPanelOpen(false)}
            style={{ ...brandButton({ radius: 8, padding: "12px 22px", fontSize: 14 }), width: "100%", border: "none", fontFamily: "inherit", fontWeight: 700, cursor: "pointer" }}
          >
            {/* Live count — filters apply instantly, this just closes the panel. */}
            {t.showResults.replace("{n}", String(total))}
          </button>
        }
      >
        <div style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", padding: "4px 20px 16px" }}>
          {panel}
        </div>
      </SideDrawer>

      <SortSheet
        open={sortOpen}
        onClose={() => setSortOpen(false)}
        sort={facets.sort}
        options={sorts}
        onChange={facets.setSort}
      />
    </>
  );
}
