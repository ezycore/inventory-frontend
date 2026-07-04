"use client";
// coding-standard: maintained

import { useShopperOrders, useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { money } from "@/components/storefront/format";
import { StatusPill } from "@/components/storefront/sf-bits";

/**
 * Orders section — order history rows; "View details" opens the in-page
 * tracking sub-view (the Orders nav item stays highlighted there).
 */
export function OrdersSection({ onTrack }: { onTrack: (orderNumber: string) => void }) {
  const { slug } = useStoreContext();
  const { t, lang } = useStorefrontUI();
  const { data: store } = useStore(slug);
  const { data: orders, isLoading } = useShopperOrders(slug);
  const currency = store?.currency;

  if (isLoading) {
    return <p style={{ fontSize: 13, color: "var(--muted)" }}>Loading…</p>;
  }
  if (!orders?.length) {
    return (
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "40px 30px", textAlign: "center", fontSize: 14, color: "var(--muted)" }}>
        {t.noResults}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      {orders.map((o) => {
        const itemCount = o.items.reduce((n, i) => n + i.quantity, 0);
        const payLabel = o.paymentMethod === "cod" ? t.cod : t.bankTransfer;
        return (
          <div
            key={o._id}
            style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}
          >
            <div style={{ flex: 1, minWidth: 150 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                <span className="sf-mono" style={{ fontSize: 14, fontWeight: 700 }}>{o.orderNumber}</span>
                <StatusPill status={o.status} lang={lang} />
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
                {new Date(o.createdAt).toLocaleDateString(t.langCode, { day: "2-digit", month: "short", year: "numeric" })}
                {" · "}
                {itemCount} {t.items} · {payLabel}
              </div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{money(o.totalAmount, currency)}</div>
            <button
              type="button"
              onClick={() => onTrack(o.orderNumber)}
              style={{ background: "var(--primary)", color: "var(--on-primary)", border: "none", padding: "9px 16px", borderRadius: 8, fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
            >
              {t.viewDetails}
            </button>
          </div>
        );
      })}
    </div>
  );
}
