"use client";
// coding-standard: maintained

import { useMemo, useState } from "react";
import { useTags } from "@/services/api/modules/tags/hooks";
import { useVariantAttributes } from "@/services/api/modules/variants/hooks";
import {
  FILTER_ENTRIES,
  FILTER_PLACEMENTS,
  MAX_QUICK_CHIPS,
  optionGroupId,
  tagGroupId,
  type FilterOption,
  type ResolvedFilterSettings,
} from "@/lib/storefront-filters";
import { cn } from "@/ui/lib/utils";
import { SegmentedField } from "@/ui/components/segmented-field";
import {
  PartBlock,
  PartField,
  PartHint,
  PartSwitch,
} from "@/components/ecommerce/customize/part-group";
import {
  FilterGroupsEditor,
  type GroupCandidate,
} from "@/components/ecommerce/customize/filter-groups-editor";
import {
  PriceFilterFields,
  SortFields,
} from "@/components/ecommerce/customize/filter-sort-price-fields";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";

type Device = "mobile" | "desktop";

const segments = <T extends string>(options: readonly FilterOption<T>[]) =>
  options.map((o) => ({ value: o.id, label: o.label, description: o.description }));

const FIXED: GroupCandidate[] = [
  { id: "category", kind: "category", label: "Category" },
  { id: "brand", kind: "brand", label: "Brand" },
  { id: "tags", kind: "tags", label: "Tags" },
  { id: "price", kind: "price", label: "Price range" },
  { id: "availability", kind: "availability", label: "Availability" },
];

/**
 * Filters & sort — the catalogue's filters on the collection, campaign and
 * search pages, site-wide (plan `docs/plan/storefront-filter-controls.md`).
 *
 * Phone first, like Menu: the device switch opens on Phone and the preview
 * follows it. What is not device-specific — the groups, price, brands, sort —
 * sits under both.
 */
export function FiltersPart({
  draft,
  patch,
  onPreviewDevice,
}: Pick<CustomizeDraftApi, "draft" | "patch"> & {
  onPreviewDevice?: (device: Device) => void;
}) {
  const [device, setDevice] = useState<Device>("mobile");
  const f = draft.navFilters;
  const set = (next: Partial<ResolvedFilterSettings>) =>
    patch({ navFilters: { ...f, ...next } });
  const candidates = useGroupCandidates();

  return (
    <>
      <PartBlock label="Filters">
        <PartSwitch
          label="Show filters"
          detail={f.enabled ? "Shoppers can narrow the products" : "Only the sort is offered"}
          checked={f.enabled}
          onCheckedChange={(enabled) => set({ enabled })}
        />
      </PartBlock>

      {f.enabled ? (
        <>
          <PartBlock label="Where they appear">
            <SegmentedField
              label="Device"
              caption={false}
              value={device}
              onChange={(v) => {
                const next: Device = v === "desktop" ? "desktop" : "mobile";
                setDevice(next);
                onPreviewDevice?.(next);
              }}
              options={[
                { value: "mobile", label: "Phone" },
                { value: "desktop", label: "Computer" },
              ]}
            />
          </PartBlock>

          {device === "mobile" ? (
            <div className="space-y-3">
              <PartField label="Filters open as">
                <SegmentedField
                  label="Filters open as"
                  value={f.mobile.entry}
                  onChange={(v) => set({ mobile: { ...f.mobile, entry: v === "drawer" ? "drawer" : "sheet" } })}
                  options={segments(FILTER_ENTRIES)}
                />
              </PartField>
              <PartSwitch
                label="Keep the filter bar in view"
                detail="Hides while scrolling down, returns on the way up"
                checked={f.mobile.stickyBar}
                onCheckedChange={(stickyBar) => set({ mobile: { ...f.mobile, stickyBar } })}
              />
              <QuickChipPicker
                candidates={candidates}
                value={f.mobile.quickChips}
                onChange={(quickChips) => set({ mobile: { ...f.mobile, quickChips } })}
              />
            </div>
          ) : (
            <PartField
              label="On a computer"
              hint={
                draft.templates.shell === "rail" && f.desktop.placement === "sidebar"
                  ? "Your pages already have the category sidebar on the left, so the filters take the right-hand side."
                  : f.desktop.placement === "sidebar"
                    ? "Pinned from 1024px wide; narrower screens get the Filters button."
                    : undefined
              }
            >
              <SegmentedField
                label="On a computer"
                value={f.desktop.placement}
                onChange={(v) =>
                  set({ desktop: { placement: v === "sidebar" || v === "bar" ? v : "drawer" } })
                }
                options={segments(FILTER_PLACEMENTS)}
              />
            </PartField>
          )}

          <PartBlock
            label="Filter groups"
            hint="Rename a group in your shoppers' words — “Fabric” says more than “Tags”. A group with nothing to offer on a page is left out there."
          >
            <FilterGroupsEditor
              candidates={candidates}
              value={f.groups}
              onChange={(groups) => set({ groups })}
            />
          </PartBlock>

          <div className="space-y-3">
            <PriceFilterFields
              mode={f.priceMode}
              ranges={f.pricePresets}
              onMode={(priceMode) => set({ priceMode })}
              onRanges={(pricePresets) => set({ pricePresets })}
            />
            <PartSwitch
              label="Pick several brands"
              detail={f.brandMulti ? "Shows products of every brand ticked" : "One brand at a time"}
              checked={f.brandMulti}
              onCheckedChange={(brandMulti) => set({ brandMulti })}
            />
            <PartSwitch
              label="Show product counts"
              checked={f.showCounts}
              onCheckedChange={(showCounts) => set({ showCounts })}
            />
          </div>
        </>
      ) : null}

      <div className="space-y-3">
        <SortFields value={f.sort} onChange={(sort) => set({ sort })} />
      </div>
    </>
  );
}

/**
 * Every group the shop could offer: the fixed five, one per variant attribute,
 * one per tag group. Read from the merchant's own attribute and tag lists; a
 * role that cannot read them still gets the fixed five.
 */
function useGroupCandidates(): GroupCandidate[] {
  const { data: attrs } = useVariantAttributes();
  const { data: tags } = useTags({ limit: 100 });
  return useMemo(() => {
    const out = [...FIXED];
    const attrRows = (attrs?.data?.items ?? []) as { name: string; status?: string }[];
    for (const a of attrRows) {
      if (a.status !== "inactive") out.push({ id: optionGroupId(a.name), kind: "option", label: a.name });
    }
    const tagRows = (tags?.items ?? []) as { group?: string }[];
    const groups = [...new Set(tagRows.map((t) => t.group?.trim()).filter((g): g is string => !!g))];
    for (const g of groups.sort()) out.push({ id: tagGroupId(g), kind: "tagGroup", label: g });
    return out;
  }, [attrs, tags]);
}

/** Up to six groups as one-tap chips above the phone grid (plan P2). */
function QuickChipPicker({
  candidates,
  value,
  onChange,
}: {
  candidates: GroupCandidate[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const full = value.length >= MAX_QUICK_CHIPS;
  return (
    <PartField label="Quick filters above the products">
      <div className="flex flex-wrap gap-1.5">
        {candidates
          .filter((c) => c.kind !== "category")
          .map((c) => {
            const at = value.indexOf(c.id);
            const on = at !== -1;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                disabled={!on && full}
                onClick={() => onChange(on ? value.filter((id) => id !== c.id) : [...value, c.id])}
                className={cn(
                  "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-medium",
                  on ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground",
                  !on && full && "opacity-50",
                )}
              >
                {on ? <span className="tabular-nums">{at + 1}.</span> : null}
                {c.kind === "availability" ? "In stock" : c.label}
              </button>
            );
          })}
      </div>
      <PartHint>
        {value.length === 0
          ? "None picked — the row is hidden. Tap in the order they should appear."
          : `${value.length} of ${MAX_QUICK_CHIPS}. A chip with nothing to offer on a page is skipped there.`}
      </PartHint>
    </PartField>
  );
}
