"use client";
// coding-standard: maintained

import type { Dispatch, SetStateAction } from "react";
import { Icon } from "@/components/storefront/sf-icons";

/**
 * Quantity − / + for one product line, with its label: never below 1, and never
 * above the stock on hand unless the product backorders. Shared by the quick-buy
 * sheet and a landing page's order form; the product page keeps its own larger
 * stepper beside its buy buttons.
 */
export function QtyStepper({
  label,
  qty,
  setQty,
  availableQty,
  canBackorder,
}: {
  label: string;
  qty: number;
  setQty: Dispatch<SetStateAction<number>>;
  availableQty: number;
  canBackorder: boolean;
}) {
  const step = (delta: number) =>
    setQty((q) =>
      Math.max(
        1,
        !canBackorder && availableQty > 0 ? Math.min(availableQty, q + delta) : q + delta,
      ),
    );

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border-strong)", borderRadius: 8, overflow: "hidden" }}>
        <button type="button" onClick={() => step(-1)} aria-label="-" style={qtyBtn}>
          <Icon name="minus" size={15} />
        </button>
        <span className="sf-mono" style={{ fontSize: 14, fontWeight: 700, minWidth: 36, textAlign: "center" }}>
          {qty}
        </span>
        <button type="button" onClick={() => step(1)} aria-label="+" style={qtyBtn}>
          <Icon name="plus" size={15} />
        </button>
      </div>
    </div>
  );
}

const qtyBtn = {
  fontFamily: "inherit",
  width: 42,
  height: 42,
  background: "var(--card)",
  border: "none",
  color: "var(--text)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
} as const;
