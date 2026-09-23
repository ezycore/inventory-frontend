"use client";
// coding-standard: maintained

import Link from "next/link";
import {
  useCancelShopperOrder,
  useShopperOrders,
  useStore,
} from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { storeHref } from "@/lib/storefront-links";
import { money } from "@/components/storefront/format";
import { Icon } from "@/components/storefront/sf-icons";
import { StatusPill } from "@/components/storefront/sf-bits";
import { storefrontPaymentMethodLabel } from "@/lib/storefront-payment-methods";
import { brandButton } from "@/lib/storefront-button";

/**
 * Orders section — order history rows; "View details" opens the in-page
 * tracking sub-view (the Orders nav item stays highlighted there).
 */
export function OrdersSection({ onTrack }: { onTrack: (orderNumber: string) => void }) {
  const { slug, base } = useStoreContext();
  const { t, lang } = useStorefrontUI();
  const { data: store } = useStore(slug);
  const { data: orders, isLoading } = useShopperOrders(slug);
  const cancelOrder = useCancelShopperOrder(slug);
  const currency = store?.currency;

  if (isLoading) {
    return <p style={{ fontSize: 13, color: "var(--muted)" }}>{t.loading}</p>;
  }
  if (!orders?.length) {
    return (
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "40px 30px", textAlign: "center", fontSize: 14, color: "var(--muted)" }}>
        {t.noOrdersYet}
      </div>
    );
  }

  return (
    <div data-clarity-mask="true" style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      {orders.map((o) => {
        const itemCount = o.items.reduce((n, i) => n + i.quantity, 0);
        const payLabel = storefrontPaymentMethodLabel(
          o.paymentMethod,
          t,
          store?.paymentMethods,
          o.paymentMethodTitle,
        );
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
            {/* Printable invoice (letterhead document on the shared print engine). */}
            <Link
              href={storeHref(base, `/account/orders/${o.orderNumber}/invoice`)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", color: "var(--text)", border: "1px solid var(--border-strong)", padding: "9px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600 }}
            >
              <Icon name="receipt" size={15} /> {t.viewInvoice}
            </Link>
            <button
              type="button"
              onClick={() => onTrack(o.orderNumber)}
              style={{ ...brandButton({ radius: 8, padding: "9px 16px", fontSize: 12.5 }), border: "none", fontFamily: "inherit", fontWeight: 600, cursor: "pointer" }}
            >
              {t.viewDetails}
            </button>
            {/* Self-cancel is only offered while pending — the server enforces the
                same window (once the merchant confirms, the button is gone). */}
            {o.status === "pending" && (
              <button
                type="button"
                disabled={cancelOrder.isPending}
                onClick={() => {
                  if (window.confirm(t.confirmCancelOrder))
                    cancelOrder.mutate(o.orderNumber);
                }}
                style={{ background: "transparent", color: "#b91c1c", border: "1px solid var(--border-strong)", padding: "9px 14px", borderRadius: 8, fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, cursor: cancelOrder.isPending ? "default" : "pointer", opacity: cancelOrder.isPending ? 0.6 : 1 }}
              >
                {t.cancelOrder}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
