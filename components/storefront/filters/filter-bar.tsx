"use client";
// coding-standard: maintained

import { useEffect, useRef, useState } from "react";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { Icon } from "@/components/storefront/sf-icons";
import {
  FilterGroupBody,
  groupLabel,
  type FilterContext,
} from "@/components/storefront/filters/filter-group-body";
import type { FilterGroup } from "@/lib/storefront-filters";

/**
 * The desktop "bar" placement (plan D2): one button per filter group above the
 * grid, each opening a popover with that group's rows — the common pattern for
 * a small catalogue, where a sidebar would be a tall column of three rows.
 *
 * One popover at a time; outside click and Esc close it. Selections apply
 * instantly (the URL), so the popover stays open for a second pick.
 */
export function FilterBar({
  groups,
  ctx,
  className,
}: {
  groups: FilterGroup[];
  ctx: FilterContext;
  className?: string;
}) {
  const { t } = useStorefrontUI();
  const [openId, setOpenId] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openId) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpenId(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null);
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [openId]);

  return (
    <div ref={root} className={className} style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
      {groups.map((g) => {
        const open = openId === g.id;
        const active = ctx.facets.activeGroups.has(g.id);
        return (
          <div key={g.id} style={{ position: "relative" }}>
            <button
              type="button"
              aria-expanded={open}
              aria-haspopup="dialog"
              onClick={() => setOpenId(open ? null : g.id)}
              className={`sf-fquick-chip${active ? " sf-on" : ""}`}
            >
              {groupLabel(g, t)}
              <Icon name="chevD" size={12} />
            </button>
            {open ? (
              <div
                role="dialog"
                aria-label={groupLabel(g, t)}
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  zIndex: 40,
                  width: 280,
                  maxHeight: 360,
                  overflowY: "auto",
                  padding: "8px 16px 12px",
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md, 10px)",
                  boxShadow: "0 18px 40px -18px rgba(0,0,0,0.35)",
                }}
              >
                <FilterGroupBody group={g} ctx={ctx} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
