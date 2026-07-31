"use client";
// coding-standard: maintained

import Link from "next/link";
import type { CatalogProduct } from "@/lib/storefront-client";
import { useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";
import { resolveTemplates } from "@/lib/storefront-templates";
import { storeHref } from "@/lib/storefront-links";
import { cardImageUrl } from "@/lib/storefront-image";
import { money, discountPct } from "@/components/storefront/format";
import { Media } from "@/components/storefront/sf-bits";
import { useCardQuickBuy } from "@/components/storefront/use-card-quick-buy";
import {
  CardCtaRow,
  CardVariantFlyout,
} from "@/components/storefront/card-buy-actions";
import { QuickBuySheet } from "@/components/storefront/quick-buy-sheet";

const CARD_STYLES: readonly string[] = ["standard", "compact", "bold"];

/**
 * Storefront product card. `full` shows the Add-to-cart / Buy-now pair
 * (featured / collection grids); `compact` shows a small "+" (dense
 * new-arrivals rows). Reads slug/base from context and links to the PDP.
 *
 * **Quick buy** — a variable product no longer has to send the shopper to the
 * product page to be bought. `useCardQuickBuy` fetches its variants on hover
 * intent (or first press) and reveals them either in `CardVariantFlyout` (one
 * short axis) or `QuickBuySheet` (anything larger). The `compact` style keeps
 * its single "+" and routes everything through the sheet — a dense row has no
 * width for a second CTA, which is the whole point of that template.
 */
export function ProductCard({
  product,
  currency,
  variant = "full",
}: {
  product: CatalogProduct;
  currency?: string;
  variant?: "full" | "compact";
}) {
  const { slug, base } = useStoreContext();
  const { t } = useStorefrontUI();
  const { data: store } = useStore(slug);
  const previewCardStyle = useSfPreview((s) => s.cardStyle);
  const qb = useCardQuickBuy(product);

  // Admin card style (live draft wins). "compact" forces the dense layout
  // everywhere; "bold" enlarges the CTA; "standard" respects the `variant`.
  const cardStyle = CARD_STYLES.includes(previewCardStyle ?? "")
    ? previewCardStyle
    : resolveTemplates(store).productCard;
  const compactLayout =
    cardStyle === "compact" || (cardStyle === "standard" && variant === "compact");
  const bold = cardStyle === "bold";

  const soldOut = qb.soldOut;
  const thumb = cardImageUrl(product.images?.[0]);
  const href = storeHref(base, `/products/${product.slug}`);
  const hasVariants = !!product.hasVariants;

  // A variable product reads "From ৳X" off its cheapest variant — until the
  // shopper picks one in the flyout, at which point the card must show THAT
  // variant's price. Skipping this lets them buy a ৳780 variant from a card
  // still advertising ৳600, which is the price they'd swear they were quoted.
  const chosen = qb.chosen;
  const price = chosen?.price ?? product.price ?? 0;
  const compareAt = chosen ? chosen.compareAtPrice : product.compareAtPrice;
  const pct = discountPct(price, compareAt);
  const showFrom = hasVariants && !chosen;

  return (
    <div
      className="sf-qb-card"
      onPointerEnter={qb.onPointerEnter}
      onPointerLeave={qb.onPointerLeave}
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: bold ? "0 8px 24px -16px rgba(0,0,0,0.35)" : undefined,
      }}
    >
      {/* The flyout is a sibling of the link, not a child: it holds buttons,
          and a <button> inside an <a> is invalid markup that browsers reparent.
          The wrapper carries the positioning context for both. */}
      <div style={{ position: "relative" }}>
        <Link href={href} style={{ position: "relative", display: "block" }}>
          <Media src={thumb} alt={product.name} label="product" radius={0} />
          {pct > 0 ? (
            <span
              style={{
                position: "absolute",
                top: 9,
                left: 9,
                background: "var(--discount-soft)",
                color: "var(--discount)",
                fontSize: 11.5,
                fontWeight: 600,
                padding: "3px 7px",
                borderRadius: 999,
              }}
            >
              -{pct}%
            </span>
          ) : null}
        </Link>
        <CardVariantFlyout qb={qb} />
      </div>
      <div style={{ padding: "12px 13px 14px", display: "flex", flexDirection: "column", flex: 1 }}>
        <Link
          href={href}
          style={{
            fontSize: 13.5,
            fontWeight: 500,
            color: "var(--text)",
            lineHeight: 1.3,
            margin: "0 0 8px",
            minHeight: 35,
          }}
        >
          {product.name}
        </Link>

        {compactLayout ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: "auto" }}>
            <span style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "0 6px", minWidth: 0 }}>
              {showFrom ? (
                <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{t.fromPrice}</span>
              ) : null}
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap" }}>
                {money(price, currency)}
              </span>
            </span>
            <button
              type="button"
              disabled={soldOut || qb.pending}
              onClick={() => qb.press("add")}
              aria-label={hasVariants ? t.selectOptions : t.addToCart}
              style={{
                background: "var(--primary-soft)",
                color: "var(--primary)",
                border: "1px solid var(--primary)",
                flex: "none",
                width: 40,
                height: 40,
                borderRadius: 7,
                fontSize: 18,
                fontWeight: 600,
                cursor: soldOut ? "not-allowed" : "pointer",
                lineHeight: 1,
                opacity: soldOut ? 0.5 : 1,
              }}
            >
              +
            </button>
          </div>
        ) : (
          <>
            {/* Wraps between the parts, never inside one: a 2-column mobile grid
                leaves ~130px here, and "From" + price + struck compare-at is
                wider than that — unwrapped, each money string broke mid-value
                and the card's overflow:hidden clipped the last one. */}
            <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "2px 7px", marginBottom: 11 }}>
              {showFrom ? (
                <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{t.fromPrice}</span>
              ) : null}
              <span style={{ fontSize: bold ? 16.5 : 14.5, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap" }}>
                {money(price, currency)}
              </span>
              {pct > 0 ? (
                <span style={{ fontSize: 12, color: "var(--faint)", textDecoration: "line-through", whiteSpace: "nowrap" }}>
                  {money(compareAt, currency)}
                </span>
              ) : null}
            </div>
            <CardCtaRow qb={qb} bold={bold} />
          </>
        )}
      </div>

      {/* Fallback surface for options too big for the flyout — multi-axis, or a
          long single axis. Mounted only once its detail payload has landed. */}
      {qb.detail ? (
        <QuickBuySheet
          open={qb.sheetOpen}
          onClose={qb.closeSheet}
          product={qb.detail}
          currency={currency}
          base={base}
          onAdd={(line) => qb.commit(line, "add")}
          onBuy={(line) => qb.commit(line, "buy")}
        />
      ) : null}
    </div>
  );
}
