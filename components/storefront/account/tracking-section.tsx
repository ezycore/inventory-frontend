"use client";
// coding-standard: maintained

import { type CSSProperties } from "react";
import { useShopperOrder, useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { ORDER_PIPELINE, ORDER_STATUS } from "@/lib/storefront-i18n";
import { money } from "@/components/storefront/format";
import { Icon } from "@/components/storefront/sf-icons";
import { StatusPill, Media } from "@/components/storefront/sf-bits";

const card: CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 22,
};
const eyebrow: CSSProperties = {
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

/**
 * Order-tracking sub-view of the Orders section: fulfillment timeline +
 * order contents + delivery address for one order.
 */
export function TrackingSection({
  orderNumber,
  onBack,
}: {
  orderNumber: string;
  onBack: () => void;
}) {
  const { slug } = useStoreContext();
  const { t, lang } = useStorefrontUI();
  const { data: store } = useStore(slug);
  const { data: order, isLoading, isError } = useShopperOrder(slug, orderNumber);
  const currency = store?.currency;

  const back = (
    <button
      type="button"
      onClick={onBack}
      style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: "var(--muted)", cursor: "pointer", alignSelf: "flex-start", background: "none", border: "none", fontFamily: "inherit", padding: 0 }}
    >
      <Icon name="back" size={16} /> {t.backToOrders}
    </button>
  );

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
        {back}
        <p style={{ fontSize: 13, color: "var(--muted)" }}>Loading…</p>
      </div>
    );
  }
  if (isError || !order) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
        {back}
        <p style={{ fontSize: 14, color: "var(--muted)" }}>{t.noResults}</p>
      </div>
    );
  }

  const cancelled =
    order.status === "cancelled" ||
    order.status === "returned" ||
    order.status === "rejected";
  const activeIdx = STATUS_INDEX[order.status] ?? 0;
  const statusNow = ORDER_STATUS[order.status]?.[lang === "bn" ? "bn" : "en"] ?? "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
      {back}
      <div style={{ display: "grid", gridTemplateColumns: "var(--cartgrid)", gap: "var(--gap)", alignItems: "start" }}>
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="sf-mono" style={{ fontSize: 17, fontWeight: 700 }}>{order.orderNumber}</span>
                <StatusPill status={order.status} lang={lang} size={12} />
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4 }}>
                {new Date(order.createdAt).toLocaleString(t.langCode)}
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
                          {statusNow}
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
          <div style={{ ...card, padding: 18 }}>
            <div style={eyebrow}>{t.orderItems}</div>
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
          <div style={{ ...card, padding: 18 }}>
            <div style={{ ...eyebrow, marginBottom: 10 }}>{t.deliveryAddress}</div>
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
