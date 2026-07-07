"use client";
// coding-standard: maintained

import Link from "next/link";
import { useParams } from "next/navigation";
import { type CSSProperties } from "react";
import { useShopperStore } from "@/services/stores/use-shopper-store";
import { useShopperOrder, useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { storeHref } from "@/lib/storefront-links";
import { Icon } from "@/components/storefront/sf-icons";
import {
  InvoiceSheet,
  buildSellerLines,
} from "@/components/storefront/invoice-sheet";

/**
 * Printable order invoice — auth/loading guards and the on-screen toolbar
 * around the shared <InvoiceSheet>. "Print / Save PDF" uses window.print();
 * the @media print rules (storefront.css) hide everything except the sheet.
 */
export default function InvoicePage() {
  const { slug, base } = useStoreContext();
  const { t, lang } = useStorefrontUI();
  const orderNumber = String(useParams().orderNumber);

  const shopper = useShopperStore((s) => s.shopper);
  const { data: store } = useStore(slug);
  const { data: order, isLoading, isError } = useShopperOrder(slug, orderNumber);

  const wrapStyle: CSSProperties = { maxWidth: 820, margin: "0 auto", padding: "22px var(--pad) 48px" };

  if (!shopper) {
    return (
      <div style={{ ...wrapStyle, textAlign: "center" }}>
        <Link href={storeHref(base, `/account?next=/account/orders/${orderNumber}/invoice`)} style={{ display: "inline-block", background: "var(--primary)", color: "var(--on-primary)", padding: "12px 24px", borderRadius: 9, fontSize: 14, fontWeight: 600 }}>
          {t.signIn}
        </Link>
      </div>
    );
  }
  if (isLoading) return <p style={{ ...wrapStyle, fontSize: 13, color: "var(--muted)" }}>Loading…</p>;
  if (isError || !order) {
    return (
      <div style={wrapStyle}>
        <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 8 }}>{t.noResults}</p>
        <Link href={storeHref(base, "/account?tab=orders")} style={{ fontSize: 13, color: "var(--primary)" }}>
          ← {t.backToOrders}
        </Link>
      </div>
    );
  }

  const seller = {
    name: store?.name ?? "Store",
    logoUrl: store?.logo?.url || store?.logo?.thumbnailUrl,
    lines: buildSellerLines(store?.contact),
  };

  return (
    <div className="sf-invoice-wrap" style={wrapStyle}>
      {/* Toolbar (never printed) */}
      <div className="sf-noprint" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <Link href={storeHref(base, "/account?tab=orders")} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>
          <Icon name="back" size={16} /> {t.backToOrders}
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", background: "var(--primary)", color: "var(--on-primary)", border: "none", padding: "11px 20px", borderRadius: 8, fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}
        >
          <Icon name="printer" size={16} /> {t.printInvoice}
        </button>
      </div>

      <InvoiceSheet order={order} seller={seller} t={t} lang={lang} currency={store?.currency} />
    </div>
  );
}
