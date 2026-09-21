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
import { useStoreImageFit } from "@/services/storefront/use-image-fit";
import { useStoreImageRatio } from "@/services/storefront/use-image-ratio";
import { ProductTagChips } from "@/components/storefront/product-tag-chips";
import { useCardQuickBuy } from "@/components/storefront/use-card-quick-buy";
import {
  CardCtaRow,
  CardRevealActions,
  CardSoldOutOverlay,
  CardVariantFlyout,
  layoutOwnsImage,
  type CardActions,
} from "@/components/storefront/card-buy-actions";
import { QuickBuySheet } from "@/components/storefront/quick-buy-sheet";

const CARD_STYLES: readonly string[] = ["standard", "compact", "bold", "editorial"];

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
  imageFit: sectionFit,
  imageRatio: sectionRatio,
}: {
  product: CatalogProduct;
  currency?: string;
  variant?: "full" | "compact";
  /**
   * A Storefront Builder section's own photo fit and frame
   * (`sectionCardMedia`). Unset follows the store's Customize → Product cards
   * choice, which is every card outside a section that sets one.
   */
  imageFit?: "cover" | "canvas";
  imageRatio?: string;
}) {
  const { slug, base } = useStoreContext();
  const { t } = useStorefrontUI();
  const { data: store } = useStore(slug);
  const previewCardStyle = useSfPreview((s) => s.cardStyle);
  const previewCardActions = useSfPreview((s) => s.cardActions);
  const storeFit = useStoreImageFit();
  const storeRatio = useStoreImageRatio();
  const imageFit = sectionFit ?? storeFit;
  const imageRatio = sectionRatio ?? storeRatio;

  const templates = resolveTemplates(store);
  // Admin card density (live draft wins). "compact" forces the dense layout
  // everywhere; "bold" enlarges the CTA; "standard" respects the `variant`.
  const cardStyle = CARD_STYLES.includes(previewCardStyle ?? "")
    ? previewCardStyle
    : templates.productCard;
  const compactLayout =
    cardStyle === "compact" || (cardStyle === "standard" && variant === "compact");
  const bold = cardStyle === "bold";
  // Editorial: no card at all. The photograph does the selling, so the border,
  // the fill and the buttons all come off — a boutique grid stops reading as one
  // the moment its products sit in boxes.
  const editorial = cardStyle === "editorial";

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
     clipped the last one. `iconOnly` drops the struck compare-at, which does
     not fit beside a 40px button.

     That test is on the CTA layout, NOT the density: `iconOnly` is the only one
     that shares this row with its button (see the `price` prop below), so it is
     the only one short of width. Keying it on `compactLayout` instead stripped
     the "was" from every dense row whose CTA sits on its own line — new
     arrivals, search, the PDP related row — while the "-N%" badge over the
     image kept rendering unconditionally. A discount badge with no anchor price
     beside it is a saving the shopper cannot check. */
  const priceRow = (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        flexWrap: "wrap",
        // The editorial card centres its type, and `text-align` does not reach
        // flex children — the row has to centre itself.
        justifyContent: editorial ? "center" : undefined,
        gap: compactLayout ? "0 6px" : "2px 7px",
        marginBottom: editorial || actions === "iconOnly" ? 0 : 11,
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
      {pct > 0 && actions !== "iconOnly" ? (
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
        background: editorial ? "transparent" : "var(--card)",
        border: editorial ? "none" : "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        // The editorial card must NOT clip: with no fill or border there is
        // nothing to clip to, and hiding overflow would cut the hover flyout.
        overflow: editorial ? "visible" : "hidden",
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
          <Media src={thumb} alt={product.name} label="product" radius={0} fit={imageFit} ratio={imageRatio} />
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
          {/* Top-RIGHT, because the three other corners are spoken for: the
              discount badge owns top-left, and the image bottom belongs to
              whichever of `CardRevealActions` / `CardVariantFlyout` this layout
              renders. Two chips max — a third turns a 130px mobile card into a
              wall of pills and hides the product it is labelling. */}
          <ProductTagChips
            tags={product.tags}
            tone="solid"
            max={2}
            style={{
              position: "absolute",
              top: 9,
              right: 9,
              maxWidth: "72%",
              justifyContent: "flex-end",
            }}
          />
          {/* Last child, so the scrim fades the discount badge and tag chips
              along with the image — a "-30%" burning bright over a product
              nobody can buy is the wrong thing to draw the eye. */}
          {soldOut ? <CardSoldOutOverlay label={t.outOfStock} /> : null}
        </Link>
        {/* Only one of these can occupy the image bottom, which is exactly why
            `layoutOwnsImage` sends `reveal` products to the sheet instead. */}
        {ctaOwnsImage ? <CardRevealActions qb={qb} /> : <CardVariantFlyout qb={qb} />}
      </div>
      <div
        style={{
          padding: editorial ? "14px 0 0" : "12px 13px 14px",
          textAlign: editorial ? "center" : undefined,
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <Link
          href={href}
          style={{
            fontSize: 13.5,
            fontWeight: 500,
            color: "var(--text)",
            lineHeight: 1.3,
            margin: product.unitLabel ? "0 0 3px" : "0 0 8px",
            minHeight: 35,
          }}
        >
          {product.name}
        </Link>

        {/* Pack size — "kg", "pcs". The one thing a grocery or pharmacy shopper
            compares before price, since "৳62" says nothing until you know
            whether it buys a kilo or a piece. Rendered only when the merchant
            set a sale unit, so a shop without units keeps its old spacing. */}
        {product.unitLabel ? (
          <span style={{ fontSize: 11.5, color: "var(--muted)", margin: "0 0 7px", lineHeight: 1.2 }}>
            {product.unitLabel}
          </span>
        ) : null}

        {/* `iconOnly` has no room for a price row of its own — the price sits
            inline beside the button, which is the shape the compact density has
            always rendered. Every other layout keeps the price on its own line. */}
        {editorial ? (
          priceRow
        ) : actions === "iconOnly" ? (
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
