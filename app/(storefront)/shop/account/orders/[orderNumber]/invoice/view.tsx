"use client";
// coding-standard: maintained

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useRef, useState, type CSSProperties } from "react";
import { useShopperStore } from "@/services/stores/use-shopper-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { LoadingSplash } from "@/components/storefront/loading-splash";
import { useShopperOrder, useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { ORDER_STATUS, type Dict, type Lang } from "@/lib/storefront-i18n";
import { storeHref } from "@/lib/storefront-links";
import { formatCurrency } from "@/lib/currency";
import { Icon } from "@/components/storefront/sf-icons";
import { orgToPrintHeader, type DocHeader } from "@/utils/print-documents";
import {
  renderStorefrontOrderInvoice,
  type OrderInvoiceLabels,
} from "@/utils/print-storefront-order";
import type { StorefrontStore } from "@/lib/storefront-client";

/** The document's printed strings, from the storefront dict (EN/BN). */
const invoiceLabels = (t: Dict): OrderInvoiceLabels => ({
  docTitle: t.invoiceTitle,
  date: t.invoiceDate,
  orderRef: t.orderRef,
  customer: t.billedTo,
  phone: t.phone,
  address: t.address,
  paymentMethod: t.paymentMethod,
  status: t.orderStatus,
  cod: t.cod,
  bankTransfer: t.bankTransfer,
  item: t.itemCol,
  qty: t.qtyCol,
  price: t.unitPriceCol,
  amount: t.amountCol,
  subtotal: t.subtotal,
  discount: t.discount,
  shipping: t.shipping,
  insideDhaka: t.insideDhaka,
  outsideDhaka: t.outsideDhaka,
  free: t.free,
  total: t.grandTotal,
  paid: t.paidLabel,
  due: t.dueLabel,
});

/**
 * Letterhead for the invoice: the org's Receipt & Print config from the public
 * store payload; falls back to the store's own identity for stores whose
 * payload predates `printable`.
 */
const storeToHeader = (store?: StorefrontStore): DocHeader => {
  const p = store?.printable;
  if (p) {
    return orgToPrintHeader(
      {
        name: p.name,
        logo: p.logo ?? undefined,
        address: p.address,
        receiptSettings: p.receiptSettings ?? undefined,
      },
      store?.name,
    );
  }
  return orgToPrintHeader({
    name: store?.name,
    logo: store?.logo ?? undefined,
    address: store?.contact?.address,
    receiptSettings: {
      phone: store?.contact?.phone,
      email: store?.contact?.email,
    },
  });
};

/** Wrap the composed document for the on-screen iframe (white paper on the page). */
const invoiceSrcDoc = (body: string, styles: string): string =>
  `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>
    ${styles}
    * { box-sizing: border-box; }
    html, body { margin: 0; }
    body { background: #fff; padding: 20px 16px; }
  </style></head><body>${body}</body></html>`;

/**
 * Shopper-facing order invoice — the SAME letterhead document the merchant
 * prints everywhere (Settings → Receipt & Print), composed by the shared print
 * engine and shown in a WYSIWYG iframe; Print targets the iframe document.
 */
export default function InvoicePage() {
  const { slug, base } = useStoreContext();
  const { t, lang } = useStorefrontUI();
  const orderNumber = String(useParams().orderNumber);

  const shopper = useShopperStore((s) => s.shopper);
  const hydrated = useHydrated();
  const { data: store } = useStore(slug);
  const { data: order, isLoading, isError } = useShopperOrder(slug, orderNumber);

  const frameRef = useRef<HTMLIFrameElement>(null);
  const [frameHeight, setFrameHeight] = useState(560);

  const srcDoc = useMemo(() => {
    if (!order) return "";
    const { body, styles } = renderStorefrontOrderInvoice(order, {
      header: storeToHeader(store),
      currency: (n) => formatCurrency(n, store?.currency),
      labels: invoiceLabels(t),
      formatDate: (iso) =>
        new Date(iso).toLocaleDateString(t.langCode, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      formatStatus: (status) =>
        ORDER_STATUS[status]?.[lang as Lang] ?? status,
    });
    return invoiceSrcDoc(body, styles);
  }, [order, store, t, lang]);

  // Size the iframe to its content (same-origin srcDoc); re-measure after the
  // logo loads. Bail on unchanged heights so onLoad→setState can't loop.
  const measure = (frame: HTMLIFrameElement | null) => {
    const doc = frame?.contentWindow?.document;
    if (!doc) return;
    const next = Math.max(doc.body.scrollHeight + 4, 320);
    setFrameHeight((prev) => (Math.abs(prev - next) > 1 ? next : prev));
  };
  const handleLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    const frame = e.currentTarget;
    measure(frame);
    setTimeout(() => measure(frame), 250);
  };

  const printFrame = () => {
    const win = frameRef.current?.contentWindow;
    if (!win) return;
    win.focus();
    win.print();
  };

  const wrapStyle: CSSProperties = { maxWidth: 900, margin: "0 auto", padding: "22px var(--pad) 48px" };

  // Session unknown until the persisted store hydrates — don't flash "Sign in".
  if (!hydrated) {
    return (
      <div style={wrapStyle}>
        <LoadingSplash />
      </div>
    );
  }
  if (!shopper) {
    return (
      <div style={{ ...wrapStyle, textAlign: "center" }}>
        <Link href={storeHref(base, `/account?next=/account/orders/${orderNumber}/invoice`)} style={{ display: "inline-block", background: "var(--primary)", color: "var(--on-primary)", padding: "12px 24px", borderRadius: 9, fontSize: 14, fontWeight: 600 }}>
          {t.signIn}
        </Link>
      </div>
    );
  }
  if (isLoading) return <p style={{ ...wrapStyle, fontSize: 13, color: "var(--muted)" }}>{t.loading}</p>;
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

  return (
    <div style={wrapStyle}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        {/* Padding + cancelling margin: a 40px touch target, same position. */}
        <Link href={storeHref(base, "/account?tab=orders")} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: "var(--muted)", padding: "10px 0", margin: "-10px 0" }}>
          <Icon name="back" size={16} /> {t.backToOrders}
        </Link>
        <button
          type="button"
          onClick={printFrame}
          style={{ display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", background: "var(--primary)", color: "var(--on-primary)", border: "none", padding: "11px 20px", borderRadius: 8, fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}
        >
          <Icon name="printer" size={16} /> {t.printInvoice}
        </button>
      </div>

      {/* The exact document that prints, on white paper whatever the theme. */}
      <iframe
        ref={frameRef}
        title={`${t.invoiceTitle} ${orderNumber}`}
        srcDoc={srcDoc}
        sandbox="allow-same-origin allow-modals"
        onLoad={handleLoad}
        style={{ width: "100%", height: frameHeight, border: "1px solid var(--border)", borderRadius: 12, background: "#fff", display: "block" }}
      />
    </div>
  );
}
