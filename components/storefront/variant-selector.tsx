"use client";
// coding-standard: maintained

import type { CSSProperties } from "react";
import type { CatalogVariant } from "@/lib/storefront-client";

/**
 * Attribute-axis chip selector for a variable product's PDP. Axes are derived
 * from the variants' `attributes` maps (e.g. Size → 1L/4L/10L, or Color + Size
 * for multi-axis products). A value chip is disabled when no in-stock variant
 * matches it combined with the other selected axes.
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

/** Default selection — the first in-stock variant (or just the first). */
export function defaultSelection(
  variants: CatalogVariant[],
): Record<string, string> {
  const pick =
    variants.find((v) => v.availableQuantity > 0 && v.price != null) ??
    variants[0];
  return { ...(pick?.attributes ?? {}) };
}

export function VariantSelector({
  variants,
  selection,
  onSelect,
}: {
  variants: CatalogVariant[];
  selection: Record<string, string>;
  onSelect: (next: Record<string, string>) => void;
}) {
  const axes = variantAxes(variants);

  // A chip is pickable when some in-stock variant has this value AND agrees
  // with the values currently selected on the OTHER axes.
  const canPick = (axis: string, value: string) =>
    variants.some(
      (v) =>
        v.attributes?.[axis] === value &&
        v.availableQuantity > 0 &&
        v.price != null &&
        Object.entries(selection).every(
          ([name, sel]) => name === axis || v.attributes?.[name] === sel,
        ),
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
      {axes.map((axis) => (
        <div key={axis.name}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            {axis.name}
            {selection[axis.name] ? (
              <span style={{ color: "var(--muted)", fontWeight: 500 }}>
                {" "}
                · {selection[axis.name]}
              </span>
            ) : null}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {axis.values.map((value) => {
              const selected = selection[axis.name] === value;
              const disabled = !canPick(axis.name, value);
              return (
                <button
                  key={value}
                  type="button"
                  disabled={disabled && !selected}
                  onClick={() => onSelect({ ...selection, [axis.name]: value })}
                  style={chip(selected, disabled)}
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

function chip(selected: boolean, disabled: boolean): CSSProperties {
  return {
    fontFamily: "inherit",
    fontSize: 13.5,
    fontWeight: 600,
    padding: "9px 16px",
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
