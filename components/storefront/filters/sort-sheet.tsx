"use client";
// coding-standard: maintained

import { useStorefrontUI } from "@/services/storefront/ui-context";
import { SideDrawer } from "@/components/storefront/side-drawer";
import { FilterRow } from "@/components/storefront/filters/filter-rows";
import { sortLabel } from "@/components/storefront/filter-toolbar";
import type { SortId } from "@/lib/storefront-filters";

/**
 * The phone's sort picker (plan P5): a small sheet of radio rows. The desktop
 * keeps its select — a popover select on a phone is a 30px target beside the
 * Filters button, and the list it opens is the OS's, not the shop's.
 *
 * Picking applies and closes: one choice, nothing to confirm.
 */
export function SortSheet({
  open,
  onClose,
  sort,
  options,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  sort: string;
  options: SortId[];
  onChange: (sort: string) => void;
}) {
  const { t } = useStorefrontUI();
  return (
    <SideDrawer open={open} onClose={onClose} side="sheet" title={t.sortLabel}>
      <div
        role="radiogroup"
        aria-label={t.sortLabel}
        style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", padding: "6px 20px 16px" }}
      >
        {options.map((id) => (
          <FilterRow
            key={id}
            label={sortLabel(id, t)}
            single
            active={sort === id}
            onClick={() => {
              onChange(id);
              onClose();
            }}
          />
        ))}
      </div>
    </SideDrawer>
  );
}
