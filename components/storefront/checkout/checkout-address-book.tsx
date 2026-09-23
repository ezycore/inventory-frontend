"use client";
// coding-standard: maintained

import type { CSSProperties } from "react";
import type { ShopperAddress } from "@/lib/storefront-client";

const card = (sel: boolean): CSSProperties => ({
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "11px 13px",
  borderRadius: 10,
  cursor: "pointer",
  border: `1px solid ${sel ? "var(--primary)" : "var(--border-strong)"}`,
  background: sel ? "var(--primary-soft)" : "var(--card)",
});

const badge: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: "var(--primary)",
  background: "var(--primary-soft)",
  padding: "2px 7px",
  borderRadius: 999,
  marginLeft: 8,
};

/**
 * The shopper's saved delivery addresses as selectable cards, plus a "New
 * address" card. Selection is the central delivery choice at checkout — the
 * default address is preselected and the shopper can switch or add a new one.
 * Purely presentational; the parent resolves the picked address into the order.
 */
export function CheckoutAddressBook({
  addresses,
  selectedId,
  isNew,
  onPick,
  onNew,
  labels,
}: {
  addresses: ShopperAddress[];
  selectedId: string | null;
  isNew: boolean;
  onPick: (address: ShopperAddress) => void;
  onNew: () => void;
  labels: { newAddress: string; default: string };
}) {
  return (
    <div data-clarity-mask="true" style={{ display: "grid", gap: 8, marginBottom: 16 }}>
      {addresses.map((a) => {
        const sel = !isNew && selectedId === a.id;
        return (
          <button key={a.id} type="button" onClick={() => onPick(a)} style={card(sel)}>
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>
              {a.label}
              {a.isDefault ? <span style={badge}>{labels.default}</span> : null}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
              {a.line}
              {a.phone ? ` · ${a.phone}` : ""}
            </div>
          </button>
        );
      })}
      <button
        type="button"
        onClick={onNew}
        style={{ ...card(isNew), fontSize: 13, fontWeight: 600, color: "var(--primary)" }}
      >
        + {labels.newAddress}
      </button>
    </div>
  );
}
