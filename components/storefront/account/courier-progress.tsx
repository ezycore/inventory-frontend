"use client";
// coding-standard: maintained

import { useStorefrontUI } from "@/services/storefront/ui-context";
import { courierStatusPresentation } from "@/lib/courier-status";
import { CourierFeed } from "@/components/storefront/courier-feed";
import type { StorefrontOrder } from "@/lib/storefront-client";

type Courier = NonNullable<StorefrontOrder["courier"]>;

/**
 * The courier detail hanging off the active step of the shopper's order timeline:
 * current delivery status, the carrier, a tracking link when there is one, and the
 * parcel's progress feed.
 *
 * The carrier is identified by its snapshotted **name**, so a courier the merchant
 * drives by hand ("RedX") reads exactly like an integrated one — that equivalence
 * is the whole point of the feature. For those couriers `history` is the merchant's
 * own updates, and it is the only delivery detail the shopper ever gets.
 */
export function CourierProgress({ courier }: { courier: Courier }) {
  const { t, lang } = useStorefrontUI();
  const bn = lang === "bn";

  const p = courierStatusPresentation(courier.normalizedStatus, courier.returnStage);
  const carrier = courier.name || courier.provider;
  const tracking = courier.trackingCode || courier.consignmentId;


  return (
    <div style={{ marginTop: 9, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 11px",
          borderRadius: 10,
          background: `${p.tone}1a`,
          boxShadow: `inset 0 0 0 1px ${p.tone}40`,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.tone, flex: "none" }} />
        <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
          <span style={{ fontSize: 12.5, fontWeight: 650, color: p.tone }}>
            {p.shopper[bn ? "bn" : "en"]}
          </span>
          {carrier ? (
            <span style={{ fontSize: 10.5, color: "var(--faint)", textTransform: "capitalize" }}>
              {carrier}
              {tracking ? ` · ${tracking}` : ""}
            </span>
          ) : null}
        </span>
      </div>

      {courier.trackingUrl ? (
        <a
          href={courier.trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 12, fontWeight: 600, color: "var(--primary)", textDecoration: "underline" }}
        >
          {t.trackParcel}
        </a>
      ) : null}

      <CourierFeed history={courier.history ?? []} />
    </div>
  );
}
