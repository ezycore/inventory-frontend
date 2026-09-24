"use client";
// coding-standard: maintained

import { useStorefrontUI } from "@/services/storefront/ui-context";
import { Icon } from "@/components/storefront/sf-icons";
import { SfSelect } from "@/components/storefront/sf-select";
import type { SortId } from "@/lib/storefront-filters";
import type { Dict } from "@/lib/storefront-i18n";

export interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

/**
 * Active-filter chips (each ✕ removes one URL param) + Clear all. This row is
 * what keeps filters legible on the grid templates, where the panel lives in
 * a drawer.
 */
export function FilterChips({
  chips,
  onClearAll,
}: {
  chips: FilterChip[];
  onClearAll: () => void;
}) {
  const { t } = useStorefrontUI();
  if (chips.length === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        flexWrap: "wrap",
        margin: "0 0 16px",
      }}
    >
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={c.onRemove}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "inherit",
            color: "var(--text)",
            background: "var(--primary-soft)",
            border: "none",
            borderRadius: 999,
            padding: "5px 11px",
            cursor: "pointer",
          }}
        >
          {c.label}
          <Icon name="close" size={12} />
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        style={{
          fontSize: 12,
          fontWeight: 600,
          fontFamily: "inherit",
          color: "var(--muted)",
          background: "none",
          border: "none",
          textDecoration: "underline",
          cursor: "pointer",
        }}
      >
        {t.clearAll}
      </button>
    </div>
  );
}

/** Filters trigger with an active-filter count badge. */
export function FiltersButton({
  activeCount,
  onClick,
  className,
}: {
  activeCount: number;
  onClick: () => void;
  className?: string;
}) {
  const { t } = useStorefrontUI();
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontSize: 12.5,
        fontWeight: 600,
        fontFamily: "inherit",
        color: "var(--text)",
        background: "var(--card)",
        border: "1px solid var(--border-strong)",
        borderRadius: 8,
        padding: "8px 13px",
        cursor: "pointer",
      }}
    >
      <Icon name="filter" size={15} />
      {t.filters}
      {activeCount > 0 ? (
        <span
          style={{
            background: "var(--primary)",
            color: "var(--on-primary)",
            fontSize: 10,
            fontWeight: 700,
            borderRadius: 999,
            minWidth: 16,
            height: 16,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 4px",
          }}
        >
          {activeCount}
        </span>
      ) : null}
    </button>
  );
}

/** Each sort's shopper-facing name. */
export function sortLabel(id: SortId, t: Dict): string {
  switch (id) {
    case "newest":
      return t.sortNewest;
    case "price_asc":
      return t.sortPriceLow;
    case "price_desc":
      return t.sortPriceHigh;
    case "discount":
      return t.sortDiscount;
    default:
      return t.sortFeatured;
  }
}

/**
 * Server-side sort picker for wider screens. Offers the merchant's visible
 * sorts only (`visibleSorts`); the phone gets `SortSheet` instead.
 */
export function SortSelect({
  sort,
  options,
  onChange,
  className,
}: {
  sort: string;
  options: SortId[];
  onChange: (sort: string) => void;
  className?: string;
}) {
  const { t } = useStorefrontUI();
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{t.sortLabel}</span>
      <SfSelect
        value={sort}
        ariaLabel={t.sortLabel}
        onChange={onChange}
        options={options.map((id) => ({ value: id, label: sortLabel(id, t) }))}
      />
    </span>
  );
}
