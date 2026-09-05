"use client";
// coding-standard: maintained

import Link from "next/link";
import { type CSSProperties } from "react";
import type { TrackedOrder } from "@/lib/storefront-client";
import { useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { storeHref } from "@/lib/storefront-links";
import { TRACK_STATUS } from "@/lib/storefront-i18n";
import { CourierFeed } from "@/components/storefront/courier-feed";
import { dateTime, money } from "@/components/storefront/format";
import { Icon } from "@/components/storefront/sf-icons";

/**
 * One tracked order, rendered.
 *
 * **Shared by both ways a buyer reaches an order**, and that is the point: the
 * token link (`/shop/t/<token>`) and the lost-link lookup (`/shop/orders/track`)
 * return the SAME `trackedOrderDto`, so they must show the same screen. They did
 * not — the lookup form pushed to `/orders/track/result`, a route that exists
 * nowhere in the app, so a guest who typed a correct order number and phone got
 * a 404 (QA-N12). The lookup cannot redirect to the token route instead: the
 * server's allowlist deliberately withholds `trackToken`, and widening it to
 * make a redirect possible would put a working credential in a URL bar to save
 * a component.
 *
 * So the lookup renders the order in place, from the response it already has.
 *
 * Presentational only — no fetching, no token, no `useParams`. The caller owns
 * how the order was obtained.
 */

export const trackStyles = {
  wrap: {
    maxWidth: 640,
    margin: "0 auto",
    width: "100%",
    padding: "22px var(--pad) 40px",
  } as CSSProperties,
  card: {
    background: "var(--surface)",
    borderRadius: 12,
    padding: 18,
    marginBottom: 14,
  } as CSSProperties,
  row: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "6px 0",
    fontSize: 14,
  } as CSSProperties,
  muted: { color: "var(--muted)", fontSize: 13 } as CSSProperties,
};

const { wrap, card, row, muted } = trackStyles;

export function TrackedOrderPanel({ order }: { order: TrackedOrder }) {
  const { slug, base } = useStoreContext();
  const { t, lang } = useStorefrontUI();
  const store = useStore(slug).data;

  const currency = store?.currency;
  const courier = order.courier;
  // Bound to the shopper's language, so the order's dates read the same way as the
  // parcel feed's — a module-level helper could not see `langCode` and printed
  // English dates under a Bangla timeline.
  const formatDate = (value?: string) => dateTime(value, t.langCode);
  // Falls back to the raw key rather than blanking: a status we have not worded
  // yet must still name itself on the one page a guest can reach.
  const statusLabel = (key: string) =>
    TRACK_STATUS[key]?.[lang === "bn" ? "bn" : "en"] ?? key;

  return (
    <div style={wrap}>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
        {statusLabel(order.status)}
      </div>
      <div style={{ ...muted, marginBottom: 18 }}>
        {t.orderNo} {order.orderNumber} · {formatDate(order.placedAt)}
      </div>

      {/* Gated on a tracking code OR a feed, not on the code alone: a manual
          courier often has no code at all, and hiding the card would then hide the
          merchant's own progress updates from the one page a guest can reach. */}
      {courier?.trackingCode || courier?.history?.length ? (
        <div style={card}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            {courier.name ?? t.trackCourier}
          </div>
          {courier.trackingCode ? (
            <div style={muted}>
              {t.trackTrackingCode}: {courier.trackingCode}
            </div>
          ) : null}
          {courier.trackingUrl ? (
            <div style={{ marginTop: 10 }}>
              <a
                href={courier.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "underline" }}
              >
                Track with the courier <Icon name="arrowRight" size={13} />
              </a>
            </div>
          ) : null}
          {/* The parcel's own event feed — the carrier's hub scans and rider
              assignment, which is what a buyer opened this link for. The card
              above it is the order; this is the parcel. */}
          {courier.history?.length ? (
            <div style={{ marginTop: 14 }}>
              <CourierFeed history={courier.history} />
            </div>
          ) : null}
        </div>
      ) : null}

      <div style={card}>
        {order.items.map((item, index) => (
          <div key={`${item.productName}-${index}`} style={row}>
            <span>
              {item.productName} × {item.quantity}
            </span>
            <span>{money(item.subtotal, currency)}</span>
          </div>
        ))}
        <div style={{ ...row, ...muted }}>
          <span>{t.subtotal}</span>
          <span>{money(order.subtotal, currency)}</span>
        </div>
        {order.discountAmount > 0 ? (
          <div style={{ ...row, ...muted }}>
            <span>{t.discount}</span>
            <span>−{money(order.discountAmount, currency)}</span>
          </div>
        ) : null}
        {order.shippingCharged > 0 ? (
          <div style={{ ...row, ...muted }}>
            <span>{t.shipping}</span>
            <span>{money(order.shippingCharged, currency)}</span>
          </div>
        ) : null}
        <div style={{ ...row, fontWeight: 700, fontSize: 15 }}>
          <span>{t.total}</span>
          <span>{money(order.totalAmount, currency)}</span>
        </div>
      </div>

      <div style={card}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>{t.trackProgress}</div>
        {order.statusHistory.map((entry, index) => (
          <div key={`${entry.status}-${index}`} style={row}>
            <span>{statusLabel(entry.status)}</span>
            <span style={muted}>{formatDate(entry.at)}</span>
          </div>
        ))}
      </div>

      <div style={muted}>
        {order.fulfillmentType === "pickup" ? t.trackCollectFrom : t.trackDeliveringTo}:{" "}
        {order.shipTo.name}
        {order.shipTo.area ? `, ${order.shipTo.area}` : ""}
        {order.shipTo.district ? `, ${order.shipTo.district}` : ""}
      </div>

      <div style={{ marginTop: 18 }}>
        <Link href={storeHref(base, "/")} style={{ textDecoration: "underline" }}>
          {t.trackBackToStore}
        </Link>
      </div>
    </div>
  );
}
