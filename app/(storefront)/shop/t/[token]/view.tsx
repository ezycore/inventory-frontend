"use client";
// coding-standard: maintained

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { type CSSProperties } from "react";
import { storefrontApi } from "@/lib/storefront-client";
import { storefront, useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { storeHref } from "@/lib/storefront-links";
import { money } from "@/components/storefront/format";
import { Icon } from "@/components/storefront/sf-icons";
import { SkeletonLine } from "@/components/storefront/sf-skeleton";

/**
 * Public order tracking — the page a tracking link opens.
 *
 * **No login, no form, and nothing to act on.** The token in the URL is the whole
 * credential, exactly as a courier's tracking link works: scoped to one order,
 * read-only, and revealing nothing the buyer does not already know. The server
 * projects an allowlist, so this page cannot render a merchant's cost or ledger
 * refs even if the model grows them later.
 *
 * For a guest this is the ONLY place their order exists to them — no SMS carries
 * the link (the merchant sends it), and they have no account to sign into. So the
 * failure state matters as much as the success one: a dead link has to say what
 * to do next rather than 404 into a void.
 */

const wrap: CSSProperties = {
  maxWidth: 640,
  margin: "0 auto",
  width: "100%",
  padding: "22px var(--pad) 40px",
};

const card: CSSProperties = {
  background: "var(--surface)",
  borderRadius: 12,
  padding: 18,
  marginBottom: 14,
};

const row: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  padding: "6px 0",
  fontSize: 14,
};

const muted: CSSProperties = { color: "var(--muted)", fontSize: 13 };

/** Status labels the buyer sees. Deliberately plainer than the admin vocabulary. */
const STATUS_LABEL: Record<string, string> = {
  pending: "Order received",
  confirmed: "Confirmed",
  processing: "Being packed",
  shipped: "On the way",
  delivered: "Delivered",
  ready_for_pickup: "Ready to collect",
  picked_up: "Collected",
  returned: "Returned",
  cancelled: "Cancelled",
  rejected: "Not accepted",
};

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleString() : "";

/** A `label ………… value` placeholder pair, matching `row` above. */
function SkeletonRow({
  label,
  value,
}: {
  label: number | string;
  value: number | string;
}) {
  return (
    <div style={row}>
      <SkeletonLine width={label} />
      <SkeletonLine width={value} />
    </div>
  );
}

/**
 * Built from the same `wrap`/`card`/`row` constants the real page uses, so the
 * shapes cannot drift apart and nothing jumps when the data lands. A reload of a
 * tracking link is a cold fetch with no cached anything, so this is the first
 * thing the buyer sees — it should look like their order arriving, not like the
 * page is broken.
 */
function TrackSkeleton({ label }: { label: string }) {
  return (
    <div style={wrap} role="status" aria-label={label}>
      <SkeletonLine width={168} height={22} radius={7} style={{ marginBottom: 10 }} />
      <SkeletonLine width={224} style={{ marginBottom: 22 }} />

      <div style={card}>
        <SkeletonRow label="52%" value={58} />
        <SkeletonRow label="44%" value={58} />
        <SkeletonRow label="36%" value={52} />
        <SkeletonRow label="30%" value={64} />
      </div>

      <div style={card}>
        <SkeletonLine width={82} style={{ marginBottom: 12 }} />
        <SkeletonRow label="38%" value={104} />
        <SkeletonRow label="30%" value={104} />
      </div>

      <SkeletonLine width="58%" />
    </div>
  );
}

export default function View() {
  const { slug, base } = useStoreContext();
  const { t, lang } = useStorefrontUI();
  const params = useParams<{ token: string }>();
  const token = String(params?.token ?? "");
  const store = useStore(slug).data;

  const { data, isPending, isError } = useQuery({
    queryKey: storefront.trackedOrder(slug, token),
    queryFn: () => storefrontApi.trackOrder(slug, token),
    enabled: !!slug && !!token,
    // A tracking link is opened repeatedly while a parcel is in transit; there is
    // no session to invalidate against, so just keep it briefly fresh.
    staleTime: 30_000,
    retry: false,
  });

  if (isPending) return <TrackSkeleton label={t.loading} />;

  if (isError || !data) {
    return (
      <div style={wrap}>
        <div style={card}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            This tracking link is no longer valid
          </div>
          {/* Unknown and expired answer identically on the server, so this copy
              must cover both without guessing which one happened. */}
          <div style={muted}>
            It may have expired, or the address may be incomplete. Ask the store
            for a fresh link, or look your order up with its number and your phone
            number.
          </div>
          <div style={{ marginTop: 12 }}>
            <Link href={storeHref(base, "/orders/track")} style={{ textDecoration: "underline" }}>
              Look up an order
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currency = store?.currency;
  const courier = data.courier;

  return (
    <div style={wrap}>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
        {STATUS_LABEL[data.status] ?? data.status}
      </div>
      <div style={{ ...muted, marginBottom: 18 }}>
        Order {data.orderNumber} · {formatDate(data.placedAt)}
      </div>

      {courier?.trackingCode ? (
        <div style={card}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            {courier.name ?? "Courier"}
          </div>
          <div style={muted}>Tracking code: {courier.trackingCode}</div>
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
        </div>
      ) : null}

      <div style={card}>
        {data.items.map((item, index) => (
          <div key={`${item.productName}-${index}`} style={row}>
            <span>
              {item.productName} × {item.quantity}
            </span>
            <span>{money(item.subtotal, currency)}</span>
          </div>
        ))}
        <div style={{ ...row, ...muted }}>
          <span>Subtotal</span>
          <span>{money(data.subtotal, currency)}</span>
        </div>
        {data.discountAmount > 0 ? (
          <div style={{ ...row, ...muted }}>
            <span>Discount</span>
            <span>−{money(data.discountAmount, currency)}</span>
          </div>
        ) : null}
        {data.shippingCharged > 0 ? (
          <div style={{ ...row, ...muted }}>
            <span>Delivery</span>
            <span>{money(data.shippingCharged, currency)}</span>
          </div>
        ) : null}
        <div style={{ ...row, fontWeight: 700, fontSize: 15 }}>
          <span>Total</span>
          <span>{money(data.totalAmount, currency)}</span>
        </div>
      </div>

      <div style={card}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Progress</div>
        {data.statusHistory.map((entry, index) => (
          <div key={`${entry.status}-${index}`} style={row}>
            <span>{STATUS_LABEL[entry.status] ?? entry.status}</span>
            <span style={muted}>{formatDate(entry.at)}</span>
          </div>
        ))}
      </div>

      <div style={muted}>
        {data.fulfillmentType === "pickup" ? "Collect from" : "Delivering to"}:{" "}
        {data.shipTo.name}
        {data.shipTo.area ? `, ${data.shipTo.area}` : ""}
        {data.shipTo.district ? `, ${data.shipTo.district}` : ""}
      </div>

      <div style={{ marginTop: 18 }}>
        <Link href={storeHref(base, "/")} style={{ textDecoration: "underline" }}>
          {lang === "bn" ? "দোকানে ফিরে যান" : "Back to the store"}
        </Link>
      </div>
    </div>
  );
}
