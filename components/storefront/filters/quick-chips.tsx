"use client";
// coding-standard: maintained

import { useState } from "react";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { Icon } from "@/components/storefront/sf-icons";
import { SideDrawer } from "@/components/storefront/side-drawer";
import {
  FilterGroupBody,
  groupLabel,
  type FilterContext,
} from "@/components/storefront/filters/filter-group-body";
import type { FilterGroup } from "@/lib/storefront-filters";

/**
 * The phone's one-tap filter row (plan P2): the groups the merchant picked in
 * `mobile.quickChips`, above the grid. "In stock" toggles in place; any other
 * chip opens a small sheet holding just that group. A picked group that has
 * nothing to offer on this page (no sizes in this collection) is skipped.
 */
export function QuickChips({ groups, ctx }: { groups: FilterGroup[]; ctx: FilterContext }) {
  const { t } = useStorefrontUI();
  const [openId, setOpenId] = useState<string | null>(null);
  const byId = new Map(groups.map((g) => [g.id, g]));
  const chips = ctx.settings.mobile.quickChips
    .map((id) => byId.get(id))
    .filter((g): g is FilterGroup => !!g);
  if (chips.length === 0) return null;
  const opened = openId ? byId.get(openId) : undefined;
  const { facets } = ctx;

  return (
    <>
      <div className="sf-mobile-only sf-fquick" role="toolbar" aria-label={t.filters}>
        {chips.map((g) => {
          const active = facets.activeGroups.has(g.id);
          const toggle = g.kind === "availability";
          return (
            <button
              key={g.id}
              type="button"
              aria-pressed={toggle ? active : undefined}
              aria-haspopup={toggle ? undefined : "dialog"}
              onClick={() =>
                toggle
                  ? facets.setParams({ inStock: facets.filters.inStock ? undefined : "1" })
                  : setOpenId(g.id)
              }
              className={`sf-fquick-chip${active ? " sf-on" : ""}`}
            >
              {toggle ? t.inStockFilter : groupLabel(g, t)}
              {toggle ? null : <Icon name="chevD" size={12} />}
            </button>
          );
        })}
        {facets.chips.length > 0 ? (
          <button type="button" onClick={facets.clearAll} className="sf-fquick-clear">
            {t.clearAll}
          </button>
        ) : null}
      </div>
      <SideDrawer
        open={!!opened}
        onClose={() => setOpenId(null)}
        side="sheet"
        title={opened ? groupLabel(opened, t) : ""}
      >
        <div style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", padding: "10px 20px 18px" }}>
          {opened ? <FilterGroupBody group={opened} ctx={ctx} /> : null}
        </div>
      </SideDrawer>
    </>
  );
}
