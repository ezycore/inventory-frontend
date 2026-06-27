"use client";

import Link from "next/link";
import { type CSSProperties } from "react";
import { useShopperStore } from "@/services/stores/use-shopper-store";
import { useShopperOrders, useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { storeHref } from "@/lib/storefront-links";
import { money } from "@/components/storefront/format";
import { StatusPill } from "@/components/storefront/sf-bits";

const wrap: CSSProperties = {
  maxWidth: "var(--maxw)",
  margin: "0 auto",
  width: "100%",
  padding: "22px var(--pad) 40px",
};

const PAY_LABEL: Record<string, { en: string; bn: string }> = {
  cod: { en: "Cash on Delivery", bn: "ক্যাশ অন ডেলিভারি" },
  bank: { en: "Bank Transfer", bn: "ব্যাংক ট্রান্সফার" },
};

export default function OrdersPage() {
  const { slug, base } = useStoreContext();
  const { t, lang } = useStorefrontUI();
  const shopper = useShopperStore((s) => s.shopper);
  const { data: store } = useStore(slug);
  const { data: orders, isLoading } = useShopperOrders(slug);
  const currency = store?.currency;

  if (!shopper) {
    return (
      <div style={{ ...wrap, maxWidth: 420, textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 14 }}>{t.tabOrders}</p>
        <Link href={storeHref(base, "/account")} style={{ display: "inline-block", background: "var(--primary)", color: "var(--on-primary)", padding: "12px 24px", borderRadius: 9, fontSize: 14, fontWeight: 600 }}>
          {t.account}
        </Link>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: "var(--h2)", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>{t.orderHistory}</h1>
        <Link href={storeHref(base, "/account")} style={{ fontSize: 13, color: "var(--muted)" }}>
          ← {t.myAccount}
        </Link>
      </div>

      {isLoading ? (
        <p style={{ fontSize: 13, color: "var(--muted)" }}>Loading…</p>
      ) : !orders || orders.length === 0 ? (
        <p style={{ fontSize: 14, color: "var(--muted)" }}>{t.emptyCartMsg}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {orders.map((o) => (
            <div key={o._id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                  <span className="sf-mono" style={{ fontSize: 14, fontWeight: 700 }}>{o.orderNumber}</span>
                  <StatusPill status={o.status} lang={lang} />
                </div>
                <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
                  {new Date(o.createdAt).toLocaleDateString()} · {o.items.length} {t.items} ·{" "}
                  {(PAY_LABEL[o.paymentMethod]?.[lang]) ?? o.paymentMethod}
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{money(o.totalAmount, currency)}</div>
              <Link href={storeHref(base, `/account/orders/${o.orderNumber}`)} style={{ background: "var(--primary)", color: "var(--on-primary)", padding: "9px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 600 }}>
                {t.trackThis}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
