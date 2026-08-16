"use client";
// coding-standard: maintained

import Link from "next/link";
import { storeHref } from "@/lib/storefront-links";
import { money } from "@/components/storefront/format";
import {
  CartHeading,
  CartLine,
  CartSummary,
} from "@/components/storefront/cart/cart-blocks";
import type { CartPageApi } from "@/components/storefront/cart/use-cart-page";

/**
 * The four cart layouts.
 *
 * Small enough to share a file — each is a dozen lines of arrangement over the
 * blocks in `cart-blocks.tsx`, and splitting them into four files would hide
 * how little separates them from each other in code while they differ
 * completely on screen.
 */

/**
 * Panel — the lines on a card, the summary in a sticky side panel.
 *
 * **The storefront's original cart, unchanged**, so Classic stamps it and it is
 * the resolver's default.
 */
export function PanelCart({ api }: { api: CartPageApi }) {
  const { t, items, lineKey } = api;
  return (
    <>
      <CartHeading api={api} />
      <div style={{ display: "grid", gridTemplateColumns: "var(--cartgrid)", gap: "var(--gap)", alignItems: "start" }}>
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "6px 18px" }}>
          {items.map((i, index) => (
            <div
              key={lineKey(i)}
              style={{ padding: "16px 0", borderBottom: index < items.length - 1 ? "1px solid var(--border)" : "none" }}
            >
              <CartLine api={api} item={i} />
            </div>
          ))}
        </div>
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>{t.orderSummary}</h3>
          <CartSummary api={api} />
        </div>
      </div>
    </>
  );
}

/**
 * Compact — dense rows on a plain ground with a **sticky bottom bar** carrying
 * the total and the checkout button.
 *
 * The quick-commerce answer, and the same reasoning as its checkout: a weekly
 * basket is long, so the side panel is scrolled out of view exactly when the
 * shopper wants it. Smaller thumbnails fit more lines on a screen, which is what
 * a shopper reviewing thirty groceries actually wants.
 */
export function CompactCart({ api }: { api: CartPageApi }) {
  const { t, items, lineKey, currency, total, estimated, amount } = api;
  return (
    <>
      <CartHeading api={api} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {items.map((i) => (
          <div key={lineKey(i)} style={{ padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
            <CartLine api={api} item={i} thumb={60} />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>{t.orderSummary}</h3>
        <CartSummary api={api} cta={false} />
      </div>

      {/* Sticky, because the summary above scrolls away on a long basket. */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          zIndex: 3,
          marginTop: 16,
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "12px 14px",
          boxShadow: "0 -6px 18px -12px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600 }}>{t.total}</div>
          <div className="sf-mono" style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em" }}>
            {estimated ? amount(total) : money(total, currency)}
          </div>
        </div>
        <div style={{ flex: "none", minWidth: 150 }}>
          <CartSummaryCta api={api} />
        </div>
      </div>
    </>
  );
}

/**
 * Cards — every line is its own card with a large photo and generous spacing.
 *
 * The calm answer: one item per block, nothing sharing an edge with anything
 * else, and the same large touch targets its account area uses. Slower to scan
 * and easier to act on, which is the right trade for a short, considered basket.
 */
export function CardsCart({ api }: { api: CartPageApi }) {
  const { t, items, lineKey } = api;
  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <CartHeading api={api} />
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
        {items.map((i) => (
          <div
            key={lineKey(i)}
            style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 16 }}
          >
            <CartLine api={api} item={i} thumb={92} />
          </div>
        ))}
      </div>
      <div style={{ marginTop: "var(--gap)", background: "var(--primary-soft)", borderRadius: "var(--radius-lg)", padding: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>{t.orderSummary}</h3>
        <CartSummary api={api} />
      </div>
    </div>
  );
}

/**
 * Editorial — large photographs, hairline rules, no cards, the summary in a
 * quiet column beside them.
 *
 * The boutique answer, and consistent with its product card and checkout: a shop
 * that shows its clothes without borders should not put them in boxes at the
 * moment of purchase.
 */
export function EditorialCart({ api }: { api: CartPageApi }) {
  const { t, items, lineKey } = api;
  return (
    <>
      <CartHeading api={api} />
      <div style={{ display: "grid", gridTemplateColumns: "var(--cartgrid)", gap: "clamp(24px,4vw,52px)", alignItems: "start" }}>
        <div>
          {items.map((i, index) => (
            <div
              key={lineKey(i)}
              style={{ padding: "20px 0", borderTop: index === 0 ? "1px solid var(--border)" : "none", borderBottom: "1px solid var(--border)" }}
            >
              <CartLine api={api} item={i} thumb={104} />
            </div>
          ))}
        </div>
        <aside>
          <h3 style={{ fontSize: 11.5, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 600, margin: "0 0 18px" }}>
            {t.orderSummary}
          </h3>
          <CartSummary api={api} />
        </aside>
      </div>
    </>
  );
}

/**
 * The checkout link on its own, for layouts that separate it from the summary.
 * `storeHref` builds the path — a hand-joined one breaks on custom domains,
 * where `base` is empty rather than "/s/<slug>".
 */
function CartSummaryCta({ api }: { api: CartPageApi }) {
  const { t, base } = api;
  return (
    <Link
      href={storeHref(base, "/checkout")}
      style={{ display: "block", textAlign: "center", background: "var(--primary)", color: "var(--on-primary)", padding: "13px 18px", borderRadius: "var(--radius-md)", fontSize: 14, fontWeight: 700 }}
    >
      {t.proceed}
    </Link>
  );
}
