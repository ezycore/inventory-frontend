"use client";
// coding-standard: maintained

import Link from "next/link";
import { useState } from "react";
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
  isGuest,
}: {
  order: StorefrontOrder;
  base: string;
  t: Dict;
  /** No account — the tracking link is the only way back to this order. */
  isGuest?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!order.trackUrl) return;
    await navigator.clipboard.writeText(order.trackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      {/* A guest has no order history to come back to, so the link IS their
          record of the order — shown, not just linked, so it can be saved. A
          signed-in shopper gets the account route instead, which is stabler. */}
      {isGuest && order.trackUrl ? (
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>
            {t.trackYourOrder}
          </div>
          <div
            className="sf-mono"
            style={{
              fontSize: 12,
              wordBreak: "break-all",
              background: "var(--surface)",
              borderRadius: 8,
              padding: "10px 12px",
              marginBottom: 10,
            }}
          >
            {order.trackUrl}
          </div>
          <button type="button" onClick={copy} style={ghostLink}>
            {copied ? t.linkCopied : t.copyLink}
          </button>
        </div>
      ) : null}
      <div style={{ display: "flex", gap: 11, justifyContent: "center", flexWrap: "wrap" }}>
        <Link
          href={
            isGuest && order.trackUrl
              ? order.trackUrl
              : storeHref(base, `/account/orders/${order.orderNumber}`)
          }
          style={primaryLink}
        >
          {t.trackThis}
        </Link>
        <Link href={storeHref(base, "/products")} style={ghostLink}>
          {t.continueShopping}
        </Link>
      </div>
    </div>
  );
}
