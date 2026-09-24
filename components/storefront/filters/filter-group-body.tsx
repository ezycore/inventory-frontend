"use client";
// coding-standard: maintained

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { money } from "@/components/storefront/format";
import { Icon } from "@/components/storefront/sf-icons";
import type { CatalogFacets } from "@/components/storefront/use-catalog-facets";
import {
  FilterRow,
  PriceBounds,
  SwitchRow,
  ValueChip,
  chipWrap,
} from "@/components/storefront/filters/filter-rows";
import {
  optionParam,
  type FilterGroup,
  type ResolvedFilterSettings,
} from "@/lib/storefront-filters";
import { collectionHref } from "@/lib/storefront-links";
import type { CatalogCategory } from "@/lib/storefront-client";
import type { Dict } from "@/lib/storefront-i18n";

/** What every group body reads — the facets hook, the settings, and one page fact. */
export interface FilterContext {
  facets: CatalogFacets;
  settings: ResolvedFilterSettings;
  /**
   * Category rows go to the category's own page (`/cushions`) instead of
   * writing `?categoryId=` — set on the bare `/products` listing only (plan F5).
   * A campaign or search page keeps the param: navigating would leave the sale
   * or drop the search term.
   */
  categoryNav: boolean;
}

/** A group's heading: the merchant's rename, else the built-in label. */
export function groupLabel(group: FilterGroup, t: Dict): string {
  if (group.label) return group.label;
  switch (group.kind) {
    case "category":
      return t.category;
    case "brand":
      return t.brandLabel;
    case "tags":
      return t.tagsLabel;
    case "price":
      return t.priceRange;
    case "availability":
      return t.availability;
    default:
      return group.name ?? "";
  }
}

/** One group's rows, whatever surface draws it. */
export function FilterGroupBody({ group, ctx }: { group: FilterGroup; ctx: FilterContext }) {
  switch (group.kind) {
    case "category":
      return <CategoryBody ctx={ctx} />;
    case "option":
      return <OptionBody name={group.name ?? ""} ctx={ctx} />;
    case "brand":
      return <BrandBody ctx={ctx} />;
    case "tags":
    case "tagGroup":
      return <TagBody group={group.kind === "tagGroup" ? group.name : undefined} ctx={ctx} />;
    case "price":
      return <PriceBody ctx={ctx} />;
    case "availability":
      return <AvailabilityBody ctx={ctx} />;
  }
}

const column = { display: "flex", flexDirection: "column" } as const;

/* -------------------------------- category -------------------------------- */

/**
 * The category tree as an accordion (plan P3): parents folded except the one
 * being browsed, each opening onto "All ‹Parent›" and its children.
 *
 * The tree used to be fully expanded, deliberately — an earlier version hid the
 * children behind a pick of their parent, and a shopper had to open the drawer
 * AND guess that picking a parent revealed more. The chevron is the fix for
 * that: the fold is visible, and the parent row itself opens it rather than
 * filtering by it, so nothing is found by accident or hidden by one.
 */
function CategoryBody({ ctx }: { ctx: FilterContext }) {
  const { t } = useStorefrontUI();
  const { base } = useStoreContext();
  const router = useRouter();
  const { facets, settings, categoryNav } = ctx;
  const { filters, categories, data } = facets;
  const counts = new Map(data.categories.map((c) => [c._id, c.productCount]));
  // Before the facets answer (or for a shop with no categorised products) every
  // count is unknown, not zero — hiding on it would blank the tree.
  const scoped = data.categories.length > 0;
  const countOf = (id: string) => (settings.showCounts && scoped ? (counts.get(id) ?? 0) : undefined);
  const offered = (c: CatalogCategory) =>
    !scoped || (counts.get(c._id) ?? 0) > 0 || filters.categoryId === c._id;

  const [open, setOpen] = useState<Set<string>>(
    () => new Set(filters.categoryId ? [filters.categoryId] : []),
  );
  const flip = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pick = (parent?: CatalogCategory, child?: CatalogCategory) => {
    const target = child ?? parent;
    if (categoryNav && target) {
      // Carry the other facets across: the shopper narrowed by brand and price
      // and is now choosing where to look, not starting over.
      const qs = new URLSearchParams(window.location.search);
      for (const k of ["categoryId", "subcategoryId", "page"]) qs.delete(k);
      const s = qs.toString();
      router.push(`${collectionHref(base, target)}${s ? `?${s}` : ""}`);
      return;
    }
    facets.setParams({ categoryId: parent?._id, subcategoryId: child?._id });
  };

  return (
    <div style={column}>
      <FilterRow
        label={t.allProducts}
        single
        active={!filters.categoryId}
        onClick={() => pick()}
      />
      {categories.filter(offered).map((c) => {
        const kids = (c.children ?? []).filter(offered);
        if (kids.length === 0) {
          return (
            <FilterRow
              key={c._id}
              label={c.name}
              single
              count={countOf(c._id)}
              active={filters.categoryId === c._id}
              onClick={() => pick(c)}
            />
          );
        }
        const isOpen = open.has(c._id);
        return (
          <Fragment key={c._id}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => flip(c._id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                width: "100%",
                padding: "10px 0",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
                textAlign: "left",
                color: filters.categoryId === c._id ? "var(--text)" : "var(--muted)",
                fontWeight: filters.categoryId === c._id ? 600 : 400,
              }}
            >
              {/* Keeps the label on the same line as the radio rows' labels. */}
              <span aria-hidden style={{ width: 15, flex: "none" }} />
              <span style={{ flex: 1, minWidth: 0 }}>{c.name}</span>
              {countOf(c._id) != null ? (
                <span className="sf-mono" style={{ fontSize: 11, color: "var(--faint)" }}>
                  {countOf(c._id)}
                </span>
              ) : null}
              <span
                aria-hidden
                style={{ display: "flex", transform: isOpen ? "rotate(180deg)" : undefined, transition: "transform 0.15s" }}
              >
                <Icon name="chevD" size={14} />
              </span>
            </button>
            {isOpen ? (
              <>
                <FilterRow
                  label={t.menuAllIn.replace("{name}", c.name)}
                  nested
                  single
                  active={filters.categoryId === c._id && !filters.subcategoryId}
                  onClick={() => pick(c)}
                />
                {kids.map((child) => (
                  <FilterRow
                    key={child._id}
                    label={child.name}
                    nested
                    single
                    count={countOf(child._id)}
                    active={filters.subcategoryId === child._id}
                    onClick={() => pick(c, child)}
                  />
                ))}
              </>
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}

/* ------------------------------ option / tags ----------------------------- */

/**
 * One variant attribute's values as pills. Multi-select within the group (OR);
 * the backend ANDs groups together on ONE variant, so "M" + "Red" means a red
 * M exists, not an M in some colour and a red in some size.
 */
function OptionBody({ name, ctx }: { name: string; ctx: FilterContext }) {
  const { facets, settings } = ctx;
  const group = facets.data.options.find((o) => o.name === name);
  // The URL may spell the attribute or value in another case (a hand-typed or
  // older link); the backend matches case-insensitively, so this does too.
  const key =
    Object.keys(facets.filters.options).find((k) => k.toLowerCase() === name.toLowerCase()) ?? name;
  const selected = (facets.filters.options[key] ?? []).map((v) => v.toLowerCase());
  return (
    <div style={chipWrap}>
      {(group?.values ?? []).map((v) => {
        const active = selected.includes(v.value.toLowerCase());
        return (
          <ValueChip
            key={v.value}
            label={v.value}
            count={settings.showCounts ? v.productCount : undefined}
            active={active}
            onClick={() => {
              const current = facets.filters.options[key] ?? [];
              const next = active
                ? current.filter((x) => x.toLowerCase() !== v.value.toLowerCase())
                : [...current, v.value];
              facets.setParams({ [optionParam(key)]: next.join(",") || undefined });
            }}
          />
        );
      })}
    </div>
  );
}

function BrandBody({ ctx }: { ctx: FilterContext }) {
  const { t } = useStorefrontUI();
  const { facets, settings } = ctx;
  const selected = facets.filters.brandIds;
  const single = !settings.brandMulti;
  return (
    <div style={column}>
      {single ? (
        <FilterRow
          label={t.allBrands}
          single
          active={selected.length === 0}
          onClick={() => facets.setParams({ brandId: undefined })}
        />
      ) : null}
      {facets.data.brands.map((b) => (
        <FilterRow
          key={b._id}
          label={b.name}
          single={single}
          count={settings.showCounts ? b.productCount : undefined}
          active={selected.includes(b._id)}
          onClick={() =>
            single ? facets.setParams({ brandId: b._id }) : facets.toggle("brandId", b._id)
          }
        />
      ))}
    </div>
  );
}

/** Tags are OR-combined across every group — one `tags` param, as before. */
function TagBody({ group, ctx }: { group?: string; ctx: FilterContext }) {
  const { facets, settings } = ctx;
  const rows = facets.data.tags.filter((tag) => (tag.group || undefined) === group);
  return (
    <div style={column}>
      {rows.map((tag) => (
        <FilterRow
          key={tag._id}
          label={tag.name}
          count={settings.showCounts ? tag.productCount : undefined}
          active={facets.filters.tags.includes(tag.slug)}
          onClick={() => facets.toggle("tags", tag.slug)}
        />
      ))}
    </div>
  );
}

/* ------------------------------ price / stock ----------------------------- */

/** A price range's chip label — "Under ৳500", "৳500 – ৳1,000", "৳2,000 and up". */
export function presetLabel(
  p: { min?: number; max?: number },
  t: Dict,
  currency?: string,
): string {
  if (p.min != null && p.max != null) return `${money(p.min, currency)} – ${money(p.max, currency)}`;
  if (p.max != null) return t.priceUnder.replace("{max}", money(p.max, currency));
  return t.priceAbove.replace("{min}", money(p.min ?? 0, currency));
}

/**
 * Ready-made ranges and/or typed bounds (`priceMode`). The merchant's own ranges
 * win over the ones built from the catalogue. A range and a typed pair are the
 * same two params, so they cannot fight: typing replaces the range, and the
 * range chip lights only while the params still match it exactly.
 */
function PriceBody({ ctx }: { ctx: FilterContext }) {
  const { t } = useStorefrontUI();
  const { facets, settings } = ctx;
  const { minPrice, maxPrice } = facets.filters;
  const presets = settings.pricePresets.length ? settings.pricePresets : facets.data.price.presets;
  const showPresets = settings.priceMode !== "typed" && presets.length > 0;
  // A shop whose prices do not spread has no ranges — typed stays, or the
  // group would be a heading over nothing.
  const showTyped = settings.priceMode !== "presets" || !showPresets;
  const commit = (min?: number | string, max?: number | string) =>
    facets.setParams({
      minPrice: min != null && min !== "" ? String(min) : undefined,
      maxPrice: max != null && max !== "" ? String(max) : undefined,
    });
  return (
    <div style={{ ...column, gap: 12 }}>
      {showPresets ? (
        <div style={chipWrap}>
          {presets.map((p) => {
            const active = minPrice === String(p.min ?? "") && maxPrice === String(p.max ?? "");
            return (
              <ValueChip
                key={`${p.min ?? ""}-${p.max ?? ""}`}
                label={presetLabel(p, t, facets.currency)}
                count={settings.showCounts && "productCount" in p ? (p.productCount as number) : undefined}
                active={active}
                onClick={() => (active ? commit() : commit(p.min, p.max))}
              />
            );
          })}
        </div>
      ) : null}
      {showTyped ? <PriceBounds min={minPrice} max={maxPrice} onCommit={commit} /> : null}
    </div>
  );
}

function AvailabilityBody({ ctx }: { ctx: FilterContext }) {
  const { t } = useStorefrontUI();
  const { facets } = ctx;
  return (
    <SwitchRow
      label={t.inStockFilter}
      on={facets.filters.inStock}
      onToggle={() => facets.setParams({ inStock: facets.filters.inStock ? undefined : "1" })}
    />
  );
}
