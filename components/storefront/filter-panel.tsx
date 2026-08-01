"use client";
// coding-standard: maintained

import { useState, type ReactNode } from "react";
import type { CatalogCategory, StoreBrand } from "@/lib/storefront-client";
import { useStorefrontUI } from "@/services/storefront/ui-context";

/** Active product-list filters, straight from the URL ("" / false = unset). */
export interface ProductFilters {
  categoryId: string;
  brandId: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
}

/** Patch of query params; `undefined` deletes the param (single code path with the URL). */
export type FilterPatch = Record<string, string | undefined>;

/**
 * The products-page filter facets: Category, Brand, Price range, Availability.
 * One component, two homes — inline in the sidebar template's aside and inside
 * the filter SideDrawer everywhere else. Selections apply instantly via
 * `onChange` (URL-driven; the panel holds no staged state beyond the price
 * fields' in-progress typing).
 */
export function FilterPanel({
  categories,
  brands,
  filters,
  onChange,
}: {
  categories: CatalogCategory[];
  brands: StoreBrand[];
  filters: ProductFilters;
  onChange: (patch: FilterPatch) => void;
}) {
  const { t } = useStorefrontUI();
  return (
    <div>
      <Group title={t.category}>
        <FilterRow
          label={t.allProducts}
          active={!filters.categoryId}
          onClick={() => onChange({ categoryId: undefined })}
        />
        {categories.map((c) => (
          <FilterRow
            key={c._id}
            label={c.name}
            active={filters.categoryId === c._id}
            onClick={() => onChange({ categoryId: c._id })}
          />
        ))}
      </Group>

      {brands.length > 0 ? (
        <Group title={t.brandLabel} divider>
          <FilterRow
            label={t.allBrands}
            active={!filters.brandId}
            onClick={() => onChange({ brandId: undefined })}
          />
          {brands.map((b) => (
            <FilterRow
              key={b._id}
              label={b.name}
              count={b.productCount}
              active={filters.brandId === b._id}
              onClick={() => onChange({ brandId: b._id })}
            />
          ))}
        </Group>
      ) : null}

      <Group title={t.priceRange} divider>
        <PriceBounds
          min={filters.minPrice}
          max={filters.maxPrice}
          onCommit={(min, max) =>
            onChange({ minPrice: min || undefined, maxPrice: max || undefined })
          }
        />
      </Group>

      <Group title={t.availability} divider>
        <SwitchRow
          label={t.inStockFilter}
          on={filters.inStock}
          onToggle={() => onChange({ inStock: filters.inStock ? undefined : "1" })}
        />
      </Group>
    </div>
  );
}

function Group({
  title,
  divider,
  children,
}: {
  title: string;
  divider?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      style={
        divider
          ? { marginTop: 16, paddingTop: 15, borderTop: "1px solid var(--border)" }
          : undefined
      }
    >
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>{children}</div>
    </div>
  );
}

/** One facet row — checkbox square + label (+ optional count), single-select. */
export function FilterRow({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        width: "100%",
        fontSize: 13,
        color: active ? "var(--text)" : "var(--muted)",
        fontWeight: active ? 600 : 400,
        background: "none",
        border: "none",
        // A bare row is only as tall as its 15px box — far too small to tap.
        // Vertical padding takes it to 40px; the list gains the height it needs.
        padding: "10px 0",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span
        style={{
          width: 15,
          height: 15,
          borderRadius: 4,
          flex: "none",
          background: active ? "var(--primary)" : "transparent",
          border: active ? "none" : "1.5px solid var(--border-strong)",
        }}
      />
      <span style={{ flex: 1, minWidth: 0 }}>{label}</span>
      {count != null ? (
        <span className="sf-mono" style={{ fontSize: 11, color: "var(--faint)" }}>
          {count}
        </span>
      ) : null}
    </button>
  );
}

/**
 * Min/max price fields — plain numeric-text inputs (no native number input,
 * per house rules) committing on blur/Enter so half-typed bounds never fire a
 * fetch. Values resync when the URL changes elsewhere (chip ✕, Clear all).
 */
function PriceBounds({
  min,
  max,
  onCommit,
}: {
  min: string;
  max: string;
  onCommit: (min: string, max: string) => void;
}) {
  const { t } = useStorefrontUI();
  const [lo, setLo] = useState(min);
  const [hi, setHi] = useState(max);
  const [prev, setPrev] = useState(`${min}|${max}`);
  if (prev !== `${min}|${max}`) {
    setPrev(`${min}|${max}`);
    setLo(min);
    setHi(max);
  }

  const commit = () => {
    // Swap crossed bounds instead of returning a silently empty list.
    if (lo && hi && Number(lo) > Number(hi)) onCommit(hi, lo);
    else onCommit(lo, hi);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commit();
  };
  const digits = (v: string) => v.replace(/[^0-9]/g, "");

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <input
        type="text"
        inputMode="numeric"
        value={lo}
        placeholder={t.minLabel}
        aria-label={t.minLabel}
        onChange={(e) => setLo(digits(e.target.value))}
        onBlur={commit}
        onKeyDown={onKey}
        style={priceField}
      />
      <span style={{ color: "var(--muted)", fontSize: 12 }}>–</span>
      <input
        type="text"
        inputMode="numeric"
        value={hi}
        placeholder={t.maxLabel}
        aria-label={t.maxLabel}
        onChange={(e) => setHi(digits(e.target.value))}
        onBlur={commit}
        onKeyDown={onKey}
        style={priceField}
      />
    </div>
  );
}

const priceField: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  border: "1px solid var(--border-strong)",
  borderRadius: 8,
  padding: "9px 9px",
  // 16px is the floor that stops iOS Safari zooming the page on focus — and it
  // never zooms back out, since the viewport meta (correctly) allows scaling.
  fontSize: 16,
  fontFamily: "inherit",
  background: "var(--card)",
  color: "var(--text)",
};

function SwitchRow({
  label,
  on,
  onToggle,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 9,
        width: "100%",
        background: "none",
        border: "none",
        // Matches the option rows above — the 18px switch alone is not tappable.
        padding: "10px 0",
        cursor: "pointer",
        fontSize: 13,
        fontFamily: "inherit",
        color: on ? "var(--text)" : "var(--muted)",
        fontWeight: on ? 600 : 400,
        textAlign: "left",
      }}
    >
      {label}
      <span
        style={{
          width: 30,
          height: 18,
          borderRadius: 999,
          background: on ? "var(--primary)" : "var(--border-strong)",
          position: "relative",
          flex: "none",
          transition: "background 0.15s",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: on ? 14 : 2,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.15s",
          }}
        />
      </span>
    </button>
  );
}
