"use client";
// coding-standard: maintained

import { cartLineKey } from "@/services/stores/use-cart-store";
import { money } from "@/components/storefront/format";
import { Media } from "@/components/storefront/sf-bits";
import type { CheckoutApi } from "@/components/storefront/checkout/use-checkout";

/**
 * What is in the order, with the photos.
 *
 * The summary used to be four numbers and nothing recognisable, which is a bad
 * trade at the exact moment a shopper is deciding whether to trust the total.
 * The photo is the cheapest reassurance available — they already chose these
 * items by looking at them.
 *
 * `thumbs={false}` gives the plain text list, which is what the review step and
 * the narrow editorial column want; `ReviewBlock` renders through here so there
 * is one item-list renderer rather than two that drift.
 */
export function OrderLines({
  api,
  thumbs = true,
}: {
  api: CheckoutApi;
  thumbs?: boolean;
}) {
  const { currency, items } = api;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: thumbs ? 12 : 0 }}>
      {items.map((i) => (
        <div
          key={cartLineKey(i)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: thumbs ? 11 : 8,
            fontSize: 13.5,
            ...(thumbs
              ? null
              : { padding: "9px 0", borderBottom: "1px solid var(--border)" }),
          }}
        >
          {thumbs ? (
            <div style={{ width: 44, height: 44, flex: "none" }}>
              <Media src={i.image} alt={i.name} radius={8} />
            </div>
          ) : null}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>{i.name}</div>
            <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
              {i.variantLabel ? `${i.variantLabel} · ` : ""}
              <span className="sf-mono">×{i.quantity}</span>
            </div>
          </div>
          <span className="sf-mono" style={{ fontSize: 13, fontWeight: 600, flex: "none" }}>
            {money(i.price * i.quantity, currency)}
          </span>
        </div>
      ))}
    </div>
  );
}
