"use client";
// coding-standard: maintained

import type { CSSProperties } from "react";
import type { StoreTemplates } from "@/lib/storefront-client";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { Icon } from "@/components/storefront/sf-icons";
import { VariantSelector } from "@/components/storefront/variant-selector";
import type { CardQuickBuy } from "@/components/storefront/use-card-quick-buy";

export type CardActions = StoreTemplates["cardActions"];

/**
 * The rendered halves of quick buy on a product card. They are separate
 * components because they mount in different parts of the card — the flyout is
 * absolutely positioned inside the image frame, the CTA row sits in the padded
 * body (or, for `reveal`, over the image) — while sharing one `useCardQuickBuy`
 * state machine.
 *
 * **The CTA layout is a merchant setting** (`templates.cardActions`), not a
 * constant. `layoutOwnsImage` below is the one rule that matters: when the CTA
 * is painted over the product image, the variant flyout has nowhere to go, so
 * the card hands variable products to the quick-buy sheet instead.
 */

/**
 * Whether a layout paints its CTA over the product image rather than in the
 * card body. Those layouts cannot also host the variant flyout there — see
 * `useCardQuickBuy`, which reads this to pick the options surface.
 *
 * Exported (and unit-tested) because getting it wrong is silent: the flyout and
 * the buttons would simply overlap, and only a variable product would show it.
 */
export function layoutOwnsImage(actions: CardActions): boolean {
  return actions === "reveal";
}

/** Layouts that render no CTA in the card body (it lives over the image). */
const OVER_IMAGE: CardActions[] = ["reveal"];

/**
 * Option chips over the bottom of the card image, for a product whose single
 * short axis fits there (`optionsFitInline`). Revealed by hover on a fine
 * pointer (CSS, `.sf-qb-card:hover`) or by the first press on touch
 * (`.sf-open`) — see storefront.css.
 *
 * Rendered only once the variants have loaded, so hovering never exposes an
 * empty bar.
 */
export function CardVariantFlyout({ qb }: { qb: CardQuickBuy }) {
  if (!qb.fitsInline || qb.soldOut) return null;
  return (
    <div className={`sf-qb-flyout${qb.flyoutOpen ? " sf-open" : ""}`}>
      <VariantSelector
        compact
        variants={qb.variants}
        selection={qb.selection}
        onSelect={qb.pick}
      />
    </div>
  );
}

/**
 * The `reveal` layout's CTA: hidden until the card is hovered, then slid up over
 * the image. Below 680px — and on any device without a fine pointer — the CSS
 * pins it open, because a touch device has no hover to reveal it with.
 */
export function CardRevealActions({ qb }: { qb: CardQuickBuy }) {
  const { t } = useStorefrontUI();
  if (qb.soldOut) return null;
  return (
    <div className="sf-qb-reveal">
      <button type="button" onClick={() => qb.press("add")} disabled={qb.pending} style={cta(false, false, false)}>
        {t.addToCart}
      </button>
      <button type="button" onClick={() => qb.press("buy")} disabled={qb.pending} style={cta(true, false, false)}>
        {t.buyNow}
      </button>
    </div>
  );
}

/**
 * Sold-out treatment, half one: a scrim and a chip over the product image.
 *
 * Paired with the status line `CardCtaRow` renders below, and the two only work
 * together. On its own the old treatment was a single greyed-out **button** —
 * which still looks like a button, so the card read as broken rather than the
 * product as unavailable, and nothing about the product image said anything at
 * all. The scrim is `--card`, not a fixed white or black, so it fades the image
 * on the light theme and on the dark one.
 *
 * `aria-hidden` throughout: this is a visual restatement of the status line
 * below, and announcing it twice inside one card is noise. It also sits inside
 * the image's `<Link>`, where the text would otherwise be absorbed into that
 * link's accessible name.
 */
export function CardSoldOutOverlay({ label }: { label: string }) {
  return (
    <span
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Its own layer, so the chip stays fully opaque over the faded image. */}
      <span
        style={{
          position: "absolute",
          inset: 0,
          background: "var(--card)",
          opacity: 0.62,
        }}
      />
      <span
        style={{
          position: "relative",
          background: "var(--card)",
          color: "var(--muted)",
          border: "1px solid var(--border-strong)",
          borderRadius: 999,
          padding: "5px 12px",
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </span>
    </span>
  );
}

/**
 * Sold-out treatment, half two: a status line where the CTA would be.
 *
 * Keeps `cta()`'s 40px footprint so a sold-out card stays aligned with its
 * neighbours in the grid, but is flat, borderless and muted — it must not read
 * as a control the shopper failed to activate, which is exactly how a disabled
 * button reads.
 */
function soldOutStatus(inline: boolean): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: inline ? "none" : 1,
    minHeight: 40,
    padding: "10px 12px",
    // The controls step of the merchant's radius scale, not a literal — a card
    // CTA is the single most visible control in the shop, and hardcoding it here
    // is what kept the Corners setting from reaching the buy button at all.
    borderRadius: "var(--radius-sm)",
    background: "var(--surface)",
    color: "var(--muted)",
    fontSize: 12.5,
    fontWeight: 600,
    textAlign: "center",
    lineHeight: 1.15,
  };
}

/**
 * Card CTA row for every layout that keeps its buttons in the card body.
 * Two-button layouts sit side by side where there is room and stack below it —
 * `auto-fit` rather than a media query, because the storefront's column count
 * varies by breakpoint *and* by card density.
 */
export function CardCtaRow({
  qb,
  actions,
  bold,
  price,
}: {
  qb: CardQuickBuy;
  actions: CardActions;
  /** The "bold" card density — larger, uppercase, heavier CTA. */
  bold?: boolean;
  /** Rendered inline beside the button in `iconOnly`, which has no room below. */
  price?: React.ReactNode;
}) {
  const { t } = useStorefrontUI();

  // Checked BEFORE the over-image layouts bail: `reveal` hides its buttons
  // entirely when sold out, so without this that layout's only signal would be
  // the image overlay — nothing in the DOM saying so, and nothing announced. It
  // makes a sold-out `reveal` card slightly taller than its neighbours, which a
  // grid absorbs and is a fair price for the card stating its own state.
  if (qb.soldOut) {
    // One status line in every layout — including iconOnly, where the row still
    // has to carry the price it normally sits beside.
    return (
      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        {actions === "iconOnly" ? <span style={{ flex: 1, minWidth: 0 }}>{price}</span> : null}
        <span style={soldOutStatus(actions === "iconOnly")}>{t.outOfStock}</span>
      </div>
    );
  }

  if (OVER_IMAGE.includes(actions)) return null;

  const add = () => qb.press("add");
  const buy = () => qb.press("buy");

  // The compact density's historical shape: price on the left, one icon button
  // on the right. Buy now has no room here, so the icon is Add to cart.
  if (actions === "iconOnly") {
    return (
      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ minWidth: 0 }}>{price}</span>
        <button
          type="button"
          onClick={add}
          disabled={qb.pending}
          aria-label={qb.variable ? t.selectOptions : t.addToCart}
          title={qb.variable ? t.selectOptions : t.addToCart}
          style={{ ...cta(false, bold, false), flex: "none", width: 40, padding: 0, background: "var(--primary-soft)", color: "var(--primary)", borderColor: "var(--primary)" }}
        >
          <Icon name="plus" size={17} />
        </button>
      </div>
    );
  }

  if (actions === "add") {
    return (
      <div style={row()}>
        <button type="button" onClick={add} disabled={qb.pending} style={cta(true, bold, false)}>
          {t.addToCart}
        </button>
      </div>
    );
  }

  // Buy now leads; Add to cart drops to a quiet text link beneath it.
  if (actions === "buyFirst") {
    return (
      <div style={{ marginTop: "auto", display: "grid", gap: 2 }}>
        <button type="button" onClick={buy} disabled={qb.pending} style={cta(true, bold, false)}>
          {t.buyNow}
        </button>
        <button type="button" onClick={add} disabled={qb.pending} style={linkCta()}>
          {t.addToCart}
        </button>
      </div>
    );
  }

  // Both actions as glyphs. Text was tried first and does not survive the width:
  // a 2-column 360px grid leaves ~83px beside a 40px icon, so "Add to cart"
  // wrapped to two lines (51px row) — and Bangla's "কার্টে যোগ করুন" is longer
  // still, so the row height would have differed by locale. Glyphs are the same
  // size in every language. Both carry an aria-label AND a title: an icon names
  // nothing on its own, and this is the one layout with no visible label.
  if (actions === "icons") {
    return (
      <div style={{ marginTop: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
        <button
          type="button"
          onClick={add}
          disabled={qb.pending}
          aria-label={qb.variable ? t.selectOptions : t.addToCart}
          title={qb.variable ? t.selectOptions : t.addToCart}
          style={cta(false, bold, false)}
        >
          <Icon name="cart" size={17} />
        </button>
        <button
          type="button"
          onClick={buy}
          disabled={qb.pending}
          aria-label={t.buyNow}
          title={t.buyNow}
          style={cta(true, bold, false)}
        >
          <Icon name="bolt" size={17} />
        </button>
      </div>
    );
  }

  // "addBuy" — the default.
  return (
    <div style={row()}>
      <button type="button" onClick={add} disabled={qb.pending} style={cta(false, bold, false)}>
        {t.addToCart}
      </button>
      <button type="button" onClick={buy} disabled={qb.pending} style={cta(true, bold, false)}>
        {t.buyNow}
      </button>
    </div>
  );
}

function row(): CSSProperties {
  return {
    marginTop: "auto",
    display: "grid",
    gap: 7,
    // Deliberately not a media query: the storefront's grid columns vary by
    // breakpoint AND by card density, so the row keys off available width.
    gridTemplateColumns: "repeat(auto-fit, minmax(112px, 1fr))",
  };
}

function cta(
  primary: boolean,
  bold: boolean | undefined,
  disabled: boolean,
): CSSProperties {
  return {
    background: primary ? "var(--primary)" : "transparent",
    color: primary ? "var(--on-primary)" : "var(--text)",
    border: primary ? "1px solid var(--primary)" : "1px solid var(--border-strong)",
    padding: bold ? "12px 8px" : "10px 8px",
    minHeight: 40,
    // The controls step of the merchant's radius scale, not a literal — a card
    // CTA is the single most visible control in the shop, and hardcoding it here
    // is what kept the Corners setting from reaching the buy button at all.
    borderRadius: "var(--radius-sm)",
    fontFamily: "inherit",
    fontSize: bold ? 13 : 12.5,
    fontWeight: bold ? 700 : 600,
    textTransform: bold ? "uppercase" : "none",
    letterSpacing: bold ? "0.03em" : "normal",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    // A two-word label must not break the 40px row on a narrow card.
    lineHeight: 1.15,
  };
}

/** The demoted Add-to-cart in `buyFirst` — still a 40px target, just quiet. */
function linkCta(): CSSProperties {
  return {
    background: "none",
    border: "none",
    color: "var(--muted)",
    fontFamily: "inherit",
    fontSize: 12.5,
    fontWeight: 600,
    minHeight: 40,
    cursor: "pointer",
    textDecoration: "underline",
    textUnderlineOffset: 3,
  };
}
