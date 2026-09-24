"use client";
// coding-standard: maintained

import { useState } from "react";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { Icon } from "@/components/storefront/sf-icons";
import {
  FilterGroupBody,
  groupLabel,
  type FilterContext,
} from "@/components/storefront/filters/filter-group-body";
import type { FilterGroup } from "@/lib/storefront-filters";

/**
 * Every filter group as an accordion — the body of the phone sheet, the side
 * drawer and the desktop sidebar.
 *
 * Which groups, in what order and which start open is `orderFilterGroups`'
 * answer (merchant order, active groups open, else the first). Selections apply
 * instantly through the URL; the panel's only state is which folds are open.
 */
export function FilterPanel({ groups, ctx }: { groups: FilterGroup[]; ctx: FilterContext }) {
  return (
    <div>
      {groups.map((g, i) => (
        <AccordionGroup key={g.id} group={g} ctx={ctx} first={i === 0} />
      ))}
    </div>
  );
}

function AccordionGroup({
  group,
  ctx,
  first,
}: {
  group: FilterGroup;
  ctx: FilterContext;
  first: boolean;
}) {
  const { t } = useStorefrontUI();
  const [open, setOpen] = useState(group.open);
  // A group that gains a value (a chip tapped elsewhere, a quick chip) opens, so
  // reopening the panel shows what is applied. Adjusted during render rather
  // than in an effect so there is no closed frame first.
  const active = ctx.facets.activeGroups.has(group.id);
  const [wasActive, setWasActive] = useState(active);
  if (active !== wasActive) {
    setWasActive(active);
    if (active) setOpen(true);
  }
  const bodyId = `sf-fg-${group.id.replace(/[^a-zA-Z0-9-]/g, "_")}`;
  return (
    <div style={first ? undefined : { borderTop: "1px solid var(--border)" }}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "14px 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          color: "var(--text)",
          textAlign: "left",
        }}
      >
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 11.5,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {groupLabel(group, t)}
        </span>
        {active ? (
          <span
            aria-hidden
            style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--primary)" }}
          />
        ) : null}
        <span
          aria-hidden
          style={{ display: "flex", color: "var(--muted)", transform: open ? "rotate(180deg)" : undefined, transition: "transform 0.15s" }}
        >
          <Icon name="chevD" size={15} />
        </span>
      </button>
      {open ? (
        <div id={bodyId} style={{ paddingBottom: 14 }}>
          <FilterGroupBody group={group} ctx={ctx} />
        </div>
      ) : null}
    </div>
  );
}
