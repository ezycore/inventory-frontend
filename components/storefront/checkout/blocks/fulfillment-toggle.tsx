"use client";
// coding-standard: maintained

import type { CheckoutApi } from "@/components/storefront/checkout/use-checkout";

/** Delivery vs in-store pickup. Renders nothing unless the store offers pickup. */
export function FulfillmentToggle({ api }: { api: CheckoutApi }) {
  const { t, pickupOffered, fulfillment, setFulfillment } = api;
  if (!pickupOffered) return null;
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
      {(["delivery", "pickup"] as const).map((f) => {
        const active = fulfillment === f;
        return (
          <button
            key={f}
            type="button"
            onClick={() => setFulfillment(f)}
            style={{
              flex: 1,
              border: `1px solid ${active ? "var(--primary)" : "var(--border-strong)"}`,
              background: active ? "var(--primary-soft)" : "var(--surface)",
              color: active ? "var(--primary)" : "var(--text)",
              borderRadius: "var(--radius-md)",
              padding: "12px 14px",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: active ? 700 : 500,
              cursor: "pointer",
            }}
          >
            {f === "delivery" ? t.fulfillmentDelivery : t.fulfillmentPickup}
          </button>
        );
      })}
    </div>
  );
}
