"use client";
// coding-standard: maintained

import type { CSSProperties } from "react";
import type { CatalogVariant } from "@/lib/storefront-client";

/**
 * Attribute-axis chip selector for a variable product's PDP. Axes are derived
 * from the variants' `attributes` maps (e.g. Size → 1L/4L/10L, or Color + Size
 * for multi-axis products). A value chip is disabled when no BUYABLE variant
 * matches it combined with the other selected axes.
 *
 * "Buyable" is not "in stock": a `backorder` product sells past zero on purpose,
 * so `canBackorder` has to reach this file or the chips contradict the store's
 * own policy. Without it a backorder product's options were all struck through
 * except the one `defaultSelection` happened to land on — the shopper could buy
 * that single variant and nothing else, on a product the backend would have
 * accepted any line of (`storefront-order-lines.service.ts` resolves the same
 * behaviour and skips the stock check).
 */

/** Ordered attribute axes (key + unique values) across all variants. */
export function variantAxes(
  variants: CatalogVariant[],
): { name: string; values: string[] }[] {
  const axes: { name: string; values: string[] }[] = [];
  const seen = new Map<string, Set<string>>();
  for (const v of variants) {
    for (const [name, value] of Object.entries(v.attributes ?? {})) {
      if (!seen.has(name)) {
        seen.set(name, new Set());
        axes.push({ name, values: [] });
      }
      const set = seen.get(name)!;
      if (!set.has(value)) {
        set.add(value);
        axes.find((a) => a.name === name)!.values.push(value);
      }
    }
  }
  return axes;
}

/** The variant matching every selected axis value, if the selection is complete. */
export function matchVariant(
  variants: CatalogVariant[],
  selection: Record<string, string>,
): CatalogVariant | undefined {
  return variants.find((v) =>
    Object.entries(v.attributes ?? {}).every(
      ([name, value]) => selection[name] === value,
    ),
  );
}

/**
 * Default selection — the CHEAPEST buyable variant (or just the first).
 *
 * Cheapest, not first-in-list: the card headline follows this pick the moment
 * the variants load, so a first-in-list default can turn "From ৳300" into
 * ৳350 with no shopper action. The lowest price is the one the card already
 * advertised, so the number never moves upward on its own. Ties keep the earlier
 * variant, which is the previous behaviour for a product priced flat across its
 * options.
 *
 * "Buyable" is `isBuyable`, not `availableQuantity > 0` — the same predicate the
 * chips gate on, so the highlighted default is always one the shopper can
 * actually commit. It also keeps the price promise above intact on a backorder
 * product: every variant reads 0 there, so a stock-only test finds no candidate
 * at all and falls through to `variants[0]` — the first variant regardless of
 * price, which is the headline jump the cheapest rule exists to prevent.
 */
export function defaultSelection(
  variants: CatalogVariant[],
  canBackorder = false,
): Record<string, string> {
  let pick: CatalogVariant | undefined;
  for (const v of variants) {
    if (!isBuyable(v, canBackorder) || v.price == null) continue;
    if (!pick || v.price < pick.price!) pick = v;
  }
  return { ...((pick ?? variants[0])?.attributes ?? {}) };
}

/**
 * Can this variant be put in a cart? Stock on hand, or none needed because the
 * product backorders. The single rule behind both the default highlight and the
 * chip gating, so the two can't drift apart.
 */
const isBuyable = (v: CatalogVariant, canBackorder: boolean) =>
  canBackorder || v.availableQuantity > 0;

/** Widest single-axis chip row that still fits a card flyout at 2-column mobile. */
const INLINE_MAX_VALUES = 6;

/**
 * Whether a product's options fit in the card's inline flyout, or need the
 * quick-buy sheet. One axis of a few values is a single chip row; two axes need
 * labelled rows, and a ~150px card in the 2-column mobile grid has room for
 * neither. Drives the tiering in `card-buy-actions.tsx`.
 */
export function optionsFitInline(variants: CatalogVariant[]): boolean {
  const axes = variantAxes(variants);
  return axes.length === 1 && axes[0].values.length <= INLINE_MAX_VALUES;
}

export function VariantSelector({
  variants,
  selection,
  onSelect,
  canBackorder = false,
  compact = false,
}: {
  variants: CatalogVariant[];
  selection: Record<string, string>;
  onSelect: (next: Record<string, string>) => void;
  /**
   * The product's `outOfStockBehavior === "backorder"` — already resolved
   * (product override → store default) by the backend, so it arrives on the
   * catalog payload ready to use. Keeps a sold-out option pickable.
   */
  canBackorder?: boolean;
  /**
   * Card-flyout density: no axis headings, tighter chips, no trailing margin.
   * Only ever used where `optionsFitInline` passed, i.e. a single axis — which
   * is why dropping the heading loses nothing (there is only one thing to pick).
   */
  compact?: boolean;
}) {
  const axes = variantAxes(variants);

  // A chip is pickable when some buyable variant has this value AND agrees
  // with the values currently selected on the OTHER axes.
  const canPick = (axis: string, value: string) =>
    variants.some(
      (v) =>
        v.attributes?.[axis] === value &&
        isBuyable(v, canBackorder) &&
        v.price != null &&
        Object.entries(selection).every(
          ([name, sel]) => name === axis || v.attributes?.[name] === sel,
        ),
    );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: compact ? 8 : 14,
        marginBottom: compact ? 0 : 20,
      }}
    >
      {axes.map((axis) => (
        <div key={axis.name}>
          {compact ? null : (
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
              {axis.name}
              {selection[axis.name] ? (
                <span style={{ color: "var(--muted)", fontWeight: 500 }}>
                  {" "}
                  · {selection[axis.name]}
                </span>
              ) : null}
            </div>
          )}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: compact ? 6 : 8,
              justifyContent: compact ? "center" : undefined,
            }}
          >
            {axis.values.map((value) => {
              const selected = selection[axis.name] === value;
              const disabled = !canPick(axis.name, value);
              return (
                <button
                  key={value}
                  type="button"
                  aria-label={`${axis.name}: ${value}`}
                  aria-pressed={selected}
                  disabled={disabled && !selected}
                  onClick={() => onSelect({ ...selection, [axis.name]: value })}
                  style={chip(selected, disabled, compact)}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function chip(
  selected: boolean,
  disabled: boolean,
  compact: boolean,
): CSSProperties {
  return {
    fontFamily: "inherit",
    fontSize: compact ? 12.5 : 13.5,
    fontWeight: 600,
    // Compact trades padding for an explicit minHeight so a narrower chip still
    // clears the 40px touch-target floor — the flyout is a phone surface too,
    // not just a desktop hover affordance.
    padding: compact ? "0 11px" : "9px 16px",
    ...(compact
      ? { minHeight: 40, display: "inline-flex", alignItems: "center" }
      : null),
    borderRadius: 8,
    cursor: disabled && !selected ? "not-allowed" : "pointer",
    border: selected
      ? "1.5px solid var(--primary)"
      : "1px solid var(--border-strong)",
    background: selected ? "var(--primary-soft)" : "var(--card)",
    color: selected ? "var(--primary)" : "var(--text)",
    opacity: disabled && !selected ? 0.45 : 1,
    textDecoration: disabled && !selected ? "line-through" : "none",
  };
}
