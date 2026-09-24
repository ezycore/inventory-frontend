"use client";
// coding-standard: maintained

import Link from "next/link";
import { storeHref } from "@/lib/storefront-links";
import { Icon } from "@/components/storefront/sf-icons";
import type { CheckoutApi } from "@/components/storefront/checkout/use-checkout";

/**
 * The reassurance line under the buy button.
 *
 * **Every item is DERIVED, never asserted.** A trust strip is the easiest place
 * in a white-label storefront to ship a lie: hard-coding "7-day returns" or
 * "secure payment" makes a promise on behalf of a merchant who never made it,
 * across every store on the platform. So:
 *
 * The returns line shows only when the merchant has published a returns page,
 * and it uses **that page's own title** and links to it — the merchant wrote
 * the claim, we only point at it.
 *
 * Which means the strip renders nothing at all for a store with no returns
 * page. That is correct: nothing true was available to say.
 */
export function TrustStrip({ api }: { api: CheckoutApi }) {
  const { base, returnsPage } = api;
  if (!returnsPage) return null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px 18px",
        fontSize: 11.5,
        color: "var(--muted)",
        borderTop: "1px solid var(--border)",
        paddingTop: 13,
        marginTop: 14,
      }}
    >
      <Item>
        <Link
          href={storeHref(base, `/pages/${returnsPage.slug}`)}
          style={{ textDecoration: "underline" }}
        >
          {returnsPage.title}
        </Link>
      </Item>
    </div>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ color: "var(--primary)", display: "flex", flex: "none" }}>
        <Icon name="check" size={13} />
      </span>
      {children}
    </span>
  );
}
