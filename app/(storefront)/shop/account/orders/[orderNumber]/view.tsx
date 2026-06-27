"use client";

import Link from "next/link";
import { type CSSProperties } from "react";
import { useParams } from "next/navigation";
import { useShopperStore } from "@/services/stores/use-shopper-store";
import { useShopperOrder, useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { storeHref } from "@/lib/storefront-links";
import { ORDER_PIPELINE } from "@/lib/storefront-i18n";
import { money } from "@/components/storefront/format";
import { Icon } from "@/components/storefront/sf-icons";
import { StatusPill, Media } from "@/components/storefront/sf-bits";

const wrap: CSSProperties = {
  maxWidth: "var(--maxw)",
  margin: "0 auto",
  width: "100%",
  padding: "22px var(--pad) 40px",
};
const card: CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 22,
};
const sectionLabel: CSSProperties = {
  fontSize: 11.5,
  fontWeight: 700,
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: 12,
};

// Map a backend status to its index on the delivery pipeline.
const STATUS_INDEX: Record<string, number> = {
  pending: 0,
  placed: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
};

const STEP_LABEL_KEYS = [
  "timelinePlaced",
  "timelineConfirmed",
  "timelineProcessing",
  "timelineShipped",
  "timelineDelivered",
] as const;

export default function OrderTrackingPage() {
  const { slug, base } = useStoreContext();
  const { t, lang } = useStorefrontUI();
  const orderNumber = String(useParams().orderNumber);

  const shopper = useShopperStore((s) => s.shopper);
  const { data: store } = useStore(slug);
  const { data: order, isLoading, isError } = useShopperOrder(slug, orderNumber);
  const currency = store?.currency;

  if (!shopper) {
    return (
      <div style={{ ...wrap, maxWidth: 420, textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 14 }}>{t.tabTracking}</p>
        <Link href={storeHref(base, "/account")} style={{ display: "inline-block", background: "var(--primary)", color: "var(--on-primary)", padding: "12px 24px", borderRadius: 9, fontSize: 14, fontWeight: 600 }}>
          {t.account}
        </Link>
      </div>
    );
  }

  if (isLoading) return <p style={{ ...wrap, fontSize: 13, color: "var(--muted)" }}>Loading…</p>;
  if (isError || !order) {
    return (
      <div style={wrap}>
        <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 8 }}>{t.noResults}</p>
        <Link href={storeHref(base, "/account/orders")} style={{ fontSize: 13, color: "var(--primary)" }}>
          ← {t.orderHistory}
        </Link>
      </div>
    );
  }

  const cancelled = order.status === "cancelled" || order.status === "returned" || order.status === "rejected";
  const activeIdx = STATUS_INDEX[order.status] ?? 0;

  return (
    <div style={wrap}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <Link href={storeHref(base, "/account/orders")} style={{ fontSize: 13, color: "var(--muted)" }}>
          ← {t.orderHistory}
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "var(--cartgrid)", gap: "var(--gap)", alignItems: "start" }}>
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="sf-mono" style={{ fontSize: 17, fontWeight: 700 }}>{order.orderNumber}</span>
                <StatusPill status={order.status} lang={lang} size={12} />
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4 }}>
                {new Date(order.createdAt).toLocaleString()}
              </div>
            </div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{money(order.totalAmount, currency)}</div>
          </div>

          {cancelled ? (
            <div style={{ background: "var(--discount-soft)", color: "var(--discount)", borderRadius: 10, padding: 16, fontSize: 13.5, fontWeight: 600, textAlign: "center" }}>
              {t.orderCancelled}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {ORDER_PIPELINE.map((_, i) => {
                const done = i <= activeIdx;
                const active = i === activeIdx;
                const notLast = i < ORDER_PIPELINE.length - 1;
                return (
                  <div key={i} style={{ display: "flex", gap: 14 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none" }}>
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: done ? "var(--primary)" : "var(--surface)",
                          color: "var(--on-primary)",
                          border: done ? "none" : "2px solid var(--border-strong)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flex: "none",
                        }}
                      >
                        {done ? <Icon name="check" size={14} /> : null}
                      </span>
                      {notLast ? <span style={{ width: 2, flex: 1, minHeight: 30, background: "var(--border-strong)" }} /> : null}
                    </div>
                    <div style={{ paddingBottom: 22 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{t[STEP_LABEL_KEYS[i]]}</div>
                      {active ? (
                        <div style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, marginTop: 2 }}>
                          {lang === "bn" ? "এখন এখানে" : "Current"}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
          <div style={card}>
            <div style={sectionLabel}>{t.orderItems}</div>
            {order.items.map((ci, idx) => (
              <div key={idx} style={{ display: "flex", gap: 11, alignItems: "center", padding: "8px 0", borderBottom: idx < order.items.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ width: 42, height: 42, flex: "none" }}>
                  <Media radius={7} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.3 }}>{ci.productName}</div>
                  <div className="sf-mono" style={{ fontSize: 11, color: "var(--faint)" }}>×{ci.quantity}</div>
                </div>
                <span className="sf-mono" style={{ fontSize: 12.5, fontWeight: 600 }}>{money(ci.subtotal, currency)}</span>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={sectionLabel}>{t.deliveryAddress}</div>
            <div style={{ display: "flex", gap: 9 }}>
              <span style={{ color: "var(--primary)", display: "flex", flex: "none" }}>
                <Icon name="mapPin" size={17} />
              </span>
              <span style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
                {order.shippingAddress.name}, {order.shippingAddress.address}
                {order.shippingAddress.area ? `, ${order.shippingAddress.area}` : ""}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
