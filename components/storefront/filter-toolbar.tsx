"use client";
// coding-standard: maintained

import { useStorefrontUI } from "@/services/storefront/ui-context";
import { Icon } from "@/components/storefront/sf-icons";
import { SfSelect } from "@/components/storefront/sf-select";

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

/** Drawer trigger with an active-filter count badge. */
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

/** Server-side sort picker — Featured (default) / Newest / Price ↑ / Price ↓. */
export function SortSelect({
  sort,
  onChange,
}: {
  sort: string;
  onChange: (sort: string | undefined) => void;
}) {
  const { t } = useStorefrontUI();
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{t.sortLabel}</span>
      <SfSelect
        value={sort || "featured"}
        ariaLabel={t.sortLabel}
        onChange={(v) => onChange(v === "featured" ? undefined : v)}
        options={[
          { value: "featured", label: t.sortFeatured },
          { value: "newest", label: t.sortNewest },
          { value: "price_asc", label: t.sortPriceLow },
          { value: "price_desc", label: t.sortPriceHigh },
        ]}
      />
    </span>
  );
}
