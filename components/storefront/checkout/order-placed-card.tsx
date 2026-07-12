"use client";
// coding-standard: maintained

import Link from "next/link";
import type { StorefrontOrder } from "@/lib/storefront-client";
import type { Dict } from "@/lib/storefront-i18n";
import { storeHref } from "@/lib/storefront-links";
import { Icon } from "@/components/storefront/sf-icons";
import { ghostLink, primaryLink } from "@/components/storefront/checkout/checkout-bits";

/** Post-checkout success card — order number + track/continue CTAs. */
export function OrderPlacedCard({
  order,
  base,
  t,
}: {
  order: StorefrontOrder;
  base: string;
  t: Dict;
}) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "48px 30px", textAlign: "center" }}>
      <div style={{ width: 66, height: 66, borderRadius: "50%", background: "var(--primary-soft)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px", animation: "ezPop 0.4s" }}>
        <Icon name="check" size={30} />
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.02em" }}>{t.orderPlaced}</h2>
      <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 6px" }}>{t.orderThanks}</p>
      <p className="sf-mono" style={{ fontSize: 14, margin: "0 0 24px" }}>
        {t.orderNo} {order.orderNumber}
      </p>
      <div style={{ display: "flex", gap: 11, justifyContent: "center", flexWrap: "wrap" }}>
        <Link href={storeHref(base, `/account/orders/${order.orderNumber}`)} style={primaryLink}>
          {t.trackThis}
        </Link>
        <Link href={storeHref(base, "/products")} style={ghostLink}>
          {t.continueShopping}
        </Link>
      </div>
    </div>
  );
}
