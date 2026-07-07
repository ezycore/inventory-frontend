// coding-standard: maintained

import { type CSSProperties, type ReactNode } from "react";
import { money } from "@/components/storefront/format";
import { StatusPill } from "@/components/storefront/sf-bits";
import { Brand } from "@/components/storefront/logo-mark";
import type { Dict, Lang } from "@/lib/storefront-i18n";

/**
 * The subset of an order the invoice renders — satisfied structurally by both
 * the shopper payload (`StorefrontOrder`) and the admin payload
 * (`AdminStorefrontOrder`), so the same sheet prints on both sides.
 */
export interface InvoiceOrder {
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  items: { productName: string; price: number; quantity: number; subtotal: number }[];
  subtotal: number;
  discountAmount?: number;
  couponCode?: string;
  shippingCharged: number;
  totalAmount: number;
  shippingAddress: { name: string; phone?: string; address: string; area?: string; zone?: string };
}

/** Letterhead identity: business name, optional logo, contact lines. */
export interface InvoiceSeller {
  name: string;
  logoUrl?: string;
  lines: string[];
}

/** Address / phone / email → one letterhead line each (blanks dropped). */
export function buildSellerLines(contact?: {
  address?: string;
  phone?: string;
  email?: string;
}): string[] {
  return [contact?.address, contact?.phone, contact?.email].filter(
    (v): v is string => Boolean(v),
  );
}

const th: CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  color: "var(--faint)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  padding: "12px 8px",
  borderBottom: "2px solid var(--border-strong)",
};
const td: CSSProperties = {
  padding: "13px 8px",
  borderBottom: "1px solid var(--border)",
  verticalAlign: "top",
};
const metaLabel: CSSProperties = { fontSize: 12.5, color: "var(--muted)", whiteSpace: "nowrap" };
const metaValue: CSSProperties = { fontSize: 12.5, fontWeight: 600, color: "var(--text)" };

function MetaRow({ label, value, mono = true }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
      <span style={metaLabel}>{label}</span>
      <span className={mono ? "sf-mono" : undefined} style={{ ...metaValue, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function TotalRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ fontSize: 13, color: color ?? "var(--muted)" }}>{label}</span>
      <span className="sf-mono" style={{ fontSize: 13, color: color ?? "var(--text)" }}>{value}</span>
    </div>
  );
}

/**
 * The invoice document itself — brand-ruled letterhead, billed-to + meta,
 * itemized table and totals cascade. Pure presentation: callers supply the
 * order, the seller identity and the i18n dict; must sit inside `.sf-root`
 * so the storefront tokens (incl. the per-store `--primary`) resolve.
 */
export function InvoiceSheet({
  order,
  seller,
  t,
  lang,
  currency,
}: {
  order: InvoiceOrder;
  seller: InvoiceSeller;
  t: Dict;
  lang: Lang;
  currency?: string;
}) {
  const paid = order.paymentStatus === "paid";
  const discount = order.discountAmount ?? 0;
  const invoiceNo = `INV-${order.orderNumber.replace(/^ORD-/, "")}`;
  const issueDate = new Date(order.createdAt).toLocaleDateString(t.langCode, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const payLabel = order.paymentMethod === "cod" ? t.cod : t.bankTransfer;
  const zoneLabel =
    order.shippingAddress.zone === "outside" ? t.outsideDhaka : t.insideDhaka;

  return (
    <div className="sf-invoice-sheet" style={{ background: "var(--card)", border: "1px solid var(--border)", borderTop: "4px solid var(--primary)", borderRadius: 14, padding: "clamp(24px,4vw,44px)", color: "var(--text)" }}>
      {/* Header: business identity left, document title right */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap", paddingBottom: 26, borderBottom: "1px solid var(--border)" }}>
        <div>
          <Brand name={seller.name} logo={seller.logoUrl} markSize={40} nameSize={19} />
          {/* With an image logo, Brand shows no text — print the legal name too. */}
          {seller.logoUrl ? (
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", marginTop: 12 }}>
              {seller.name}
            </div>
          ) : null}
          {seller.lines.length > 0 ? (
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.7, marginTop: seller.logoUrl ? 4 : 10, maxWidth: 280 }}>
              {seller.lines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          ) : null}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-0.02em", textTransform: "uppercase", color: "var(--primary)" }}>
            {t.invoiceTitle}
          </div>
          <div className="sf-mono" style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4 }}>
            {invoiceNo}
          </div>
          {paid ? (
            <span style={{ display: "inline-block", marginTop: 8, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: "#15803d", border: "2px solid #15803d", borderRadius: 7, padding: "4px 12px", transform: "rotate(-3deg)" }}>
              {t.paidStamp}
            </span>
          ) : (
            <span style={{ display: "inline-block", marginTop: 8, fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", color: "var(--discount)", border: "1px solid var(--discount)", borderRadius: 999, padding: "4px 12px" }}>
              {t.duePayment}
            </span>
          )}
        </div>
      </div>

      {/* Billed to + meta */}
      <div style={{ display: "grid", gridTemplateColumns: "var(--invcols, 1fr)", gap: 22, padding: "26px 0", borderBottom: "1px solid var(--border)" }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
            {t.billedTo}
          </div>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>{order.shippingAddress.name}</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55, marginTop: 4, maxWidth: 240 }}>
            {order.shippingAddress.address}
            {order.shippingAddress.area ? `, ${order.shippingAddress.area}` : ""}
          </div>
          {order.shippingAddress.phone ? (
            <div className="sf-mono" style={{ fontSize: 12.5, color: "var(--faint)", marginTop: 4 }}>
              {order.shippingAddress.phone}
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <MetaRow label={t.orderRef} value={order.orderNumber} />
          <MetaRow label={t.invoiceDate} value={issueDate} />
          <MetaRow label={t.paymentMethod} value={payLabel} mono={false} />
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
            <span style={metaLabel}>{t.orderNo}</span>
            <StatusPill status={order.status} lang={lang} />
          </div>
        </div>
      </div>

      {/* Items table */}
      <table style={{ width: "100%", borderCollapse: "collapse", margin: "8px 0 0" }}>
        <thead>
          <tr>
            <th style={{ ...th, textAlign: "left", paddingLeft: 0 }}>{t.itemCol}</th>
            <th style={{ ...th, textAlign: "right", whiteSpace: "nowrap" }}>{t.unitPriceCol}</th>
            <th style={{ ...th, textAlign: "center" }}>{t.qtyCol}</th>
            <th style={{ ...th, textAlign: "right", paddingRight: 0 }}>{t.amountCol}</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((ci, idx) => (
            <tr key={idx}>
              <td style={{ ...td, paddingLeft: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.35 }}>{ci.productName}</div>
              </td>
              <td className="sf-mono" style={{ ...td, textAlign: "right", whiteSpace: "nowrap", fontSize: 13, color: "var(--muted)" }}>
                {money(ci.price, currency)}
              </td>
              <td className="sf-mono" style={{ ...td, textAlign: "center", fontSize: 13, color: "var(--muted)" }}>
                {ci.quantity}
              </td>
              <td className="sf-mono" style={{ ...td, textAlign: "right", paddingRight: 0, whiteSpace: "nowrap", fontSize: 13.5, fontWeight: 600 }}>
                {money(ci.subtotal, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <div style={{ width: "100%", maxWidth: 280, display: "flex", flexDirection: "column", gap: 10 }}>
          <TotalRow label={t.subtotal} value={money(order.subtotal, currency)} />
          {discount > 0 ? (
            <TotalRow
              label={`${t.discount}${order.couponCode ? ` · ${order.couponCode}` : ""}`}
              value={`− ${money(discount, currency)}`}
              color="#15803d"
            />
          ) : null}
          <TotalRow
            label={`${t.shipping} · ${zoneLabel}`}
            value={order.shippingCharged === 0 ? t.free : money(order.shippingCharged, currency)}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "2px solid var(--border-strong)", paddingTop: 12, marginTop: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{t.grandTotal}</span>
            <span className="sf-mono" style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--primary)" }}>
              {money(order.totalAmount, currency)}
            </span>
          </div>
          {discount > 0 ? (
            <div className="sf-mono" style={{ textAlign: "right", fontSize: 11.5, fontWeight: 600, color: "#15803d" }}>
              {t.youSavedLabel} {money(discount, currency)}
            </div>
          ) : null}
        </div>
      </div>

      {/* Note */}
      <div style={{ marginTop: 30, paddingTop: 20, borderTop: "1px solid var(--border)", textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{t.invoiceThanks}</div>
        <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 5 }}>{t.invoiceNote}</div>
      </div>
    </div>
  );
}
