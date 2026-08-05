"use client";
// coding-standard: maintained

import Link from "next/link";
import type { CatalogProduct, StoreTemplates } from "@/lib/storefront-client";
import { useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";
import { resolveCardActions, resolveTemplates } from "@/lib/storefront-templates";
import { storeHref } from "@/lib/storefront-links";
import { cardImageUrl } from "@/lib/storefront-image";
import { money, discountPct } from "@/components/storefront/format";
import { Media } from "@/components/storefront/sf-bits";
import { useCardQuickBuy } from "@/components/storefront/use-card-quick-buy";
import {
  CardCtaRow,
  CardRevealActions,
  CardVariantFlyout,
  layoutOwnsImage,
  type CardActions,
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
  const previewCardActions = useSfPreview((s) => s.cardActions);

  const templates = resolveTemplates(store);
  // Admin card density (live draft wins). "compact" forces the dense layout
  // everywhere; "bold" enlarges the CTA; "standard" respects the `variant`.
  const cardStyle = CARD_STYLES.includes(previewCardStyle ?? "")
    ? previewCardStyle
    : templates.productCard;
  const compactLayout =
    cardStyle === "compact" || (cardStyle === "standard" && variant === "compact");
  const bold = cardStyle === "bold";

  // Which CTA the card offers — a separate axis from density, so a compact card
  // can carry two buttons and a bold one a single icon.
  //
  // Resolved against the EFFECTIVE density (draft wins), not the saved one:
  // an unset `cardActions` falls back to `iconOnly` on compact, so switching
  // density to compact in Customize has to move that fallback too. Reading the
  // saved density here made the preview show two buttons where the shop renders
  // an inline "+". Same resolver as the storefront, so the two cannot diverge.
  const actions: CardActions = resolveCardActions(
    previewCardActions ?? store?.templates?.cardActions,
    cardStyle as StoreTemplates["productCard"],
  );
  const ctaOwnsImage = layoutOwnsImage(actions);
  const qb = useCardQuickBuy(product, ctaOwnsImage);

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

  /* Wraps between the parts, never inside one: a 2-column mobile grid leaves
     ~130px here, and "From" + price + struck compare-at is wider than that —
     unwrapped, each money string broke mid-value and the card's overflow:hidden
     clipped the last one. The dense layout drops the struck compare-at, which
     does not fit beside a 40px button. */
  const priceRow = (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        flexWrap: "wrap",
        gap: compactLayout ? "0 6px" : "2px 7px",
        marginBottom: actions === "iconOnly" ? 0 : 11,
        minWidth: 0,
      }}
    >
      {showFrom ? (
        <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{t.fromPrice}</span>
      ) : null}
      <span
        style={{
          fontSize: compactLayout ? 14 : bold ? 16.5 : 14.5,
          fontWeight: 700,
          color: "var(--text)",
          whiteSpace: "nowrap",
        }}
      >
        {money(price, currency)}
      </span>
      {pct > 0 && !compactLayout ? (
        <span style={{ fontSize: 12, color: "var(--faint)", textDecoration: "line-through", whiteSpace: "nowrap" }}>
          {money(compareAt, currency)}
        </span>
      ) : null}
    </div>
  );

  return (
    <div
      className="sf-qb-card"
      onPointerEnter={qb.onPointerEnter}
      onPointerLeave={qb.onPointerLeave}
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        // The most repeated shape in the shop — this one radius does more to
        // set the corner character than every other in the storefront.
        borderRadius: "var(--r-md)",
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
        {/* Only one of these can occupy the image bottom, which is exactly why
            `layoutOwnsImage` sends `reveal` products to the sheet instead. */}
        {ctaOwnsImage ? <CardRevealActions qb={qb} /> : <CardVariantFlyout qb={qb} />}
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

        {/* `iconOnly` has no room for a price row of its own — the price sits
            inline beside the button, which is the shape the compact density has
            always rendered. Every other layout keeps the price on its own line. */}
        {actions === "iconOnly" ? (
          <CardCtaRow qb={qb} actions={actions} bold={bold} price={priceRow} />
        ) : (
          <>
            {priceRow}
            <CardCtaRow qb={qb} actions={actions} bold={bold} />
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
