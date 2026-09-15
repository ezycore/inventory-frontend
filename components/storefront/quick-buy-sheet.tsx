"use client";
// coding-standard: maintained

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CatalogProduct } from "@/lib/storefront-client";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { useOverlayTransition } from "@/hooks/use-overlay-transition";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { storeHref } from "@/lib/storefront-links";
import { thumbImageUrl } from "@/lib/storefront-image";
import { money } from "@/components/storefront/format";
import { QtyStepper } from "@/components/storefront/qty-stepper";
import { Media } from "@/components/storefront/sf-bits";
import { VariantSelector } from "@/components/storefront/variant-selector";
import { choiceLine, resolveProductChoice } from "@/components/storefront/product-choice";
import type { QuickBuyLine } from "@/components/storefront/quick-buy-types";
import { useOrdersPaused } from "@/services/storefront/use-orders-paused";
import { OrdersPausedNotice } from "@/components/storefront/orders-paused-notice";

/** Must cover the .sf-qb-panel CSS transition (0.24s) so the exit finishes. */
const EXIT_MS = 260;

/**
 * Quick-buy overlay for a product opened from the grid — a bottom sheet on
 * phones, a centred modal from 680px (`.sf-qb-*` in storefront.css).
 *
 * It is the fallback half of the card's tiered quick buy: a product whose
 * options do not fit the in-card flyout (multi-axis, or a long single axis —
 * see `optionsFitInline`) opens here instead. `product` is the **detail**
 * payload, already fetched by the card, so this never renders a loading state:
 * the card holds its CTA pending until the variants have landed.
 *
 * Deliberately not built on `SideDrawer` — that is a full-height side panel
 * with a pinned header; the two now share the mount choreography
 * (`useOverlayTransition`) rather than the chrome.
 */
export function QuickBuySheet({
  open,
  onClose,
  product,
  currency,
  base,
  onAdd,
  onBuy,
}: {
  open: boolean;
  onClose: () => void;
  product: CatalogProduct;
  currency?: string;
  base: string;
  onAdd: (line: QuickBuyLine) => void;
  onBuy: (line: QuickBuyLine) => void;
}) {
  const { t } = useStorefrontUI();
  const paused = useOrdersPaused();
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [openedFor, setOpenedFor] = useState<string | null>(null);

  useBodyScrollLock(open);
  const { mounted, shown } = useOverlayTransition(open, EXIT_MS);

  // A fresh open is a fresh decision — reopening should not resume a half-made
  // choice from a previous visit. Adjusted during render, not in an effect: an
  // effect would paint the stale selection for a frame first, and React treats
  // "reset state when a prop changes" as a render-time concern.
  const openKey = open ? product.slug : null;
  if (openKey !== openedFor) {
    setOpenedFor(openKey);
    setPicked({});
    setQty(1);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  // The same answer as the product page gives (`resolveProductChoice`): a
  // variable product prices, stocks and illustrates itself from the chosen
  // variant, falling back to the parent.
  const choice = resolveProductChoice(product, picked);
  const {
    variable,
    variants,
    canBackorder,
    selection,
    price,
    compareAt,
    hasOld,
    availableQty,
    soldOut,
    incomplete,
  } = choice;
  const image = choice.images[0];
  // A variable product with nothing matched yet cannot be added: we would not
  // know which variant to put in the cart.
  const blocked = incomplete || soldOut;

  const line = (): QuickBuyLine => {
    const { quantity, ...item } = choiceLine(product, choice, qty);
    return { ...item, qty: quantity };
  };


  return (
    <div
      className={`sf-qb-scrim${shown ? " sf-open" : ""}`}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="sf-qb-panel"
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sf-qb-grabber" />

        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: "none", width: 78 }}>
            <Media src={thumbImageUrl(image)} alt={product.name} label="product" radius={10} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p
              style={{
                fontSize: 15,
                fontWeight: 650,
                lineHeight: 1.3,
                margin: "0 0 6px",
                letterSpacing: "-0.01em",
              }}
            >
              {product.name}
            </p>
            {/* Wraps between parts, never inside one — same rule as the card. */}
            <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "2px 9px" }}>
              <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
                {money(price, currency)}
              </span>
              {hasOld ? (
                <span style={{ fontSize: 13, color: "var(--faint)", textDecoration: "line-through", whiteSpace: "nowrap" }}>
                  {money(compareAt, currency)}
                </span>
              ) : null}
            </div>
            <span
              style={{
                display: "inline-block",
                marginTop: 7,
                fontSize: 11.5,
                fontWeight: 600,
                padding: "3px 9px",
                borderRadius: 999,
                color: soldOut ? "var(--discount)" : "var(--primary)",
                background: soldOut ? "var(--discount-soft)" : "var(--primary-soft)",
              }}
            >
              {soldOut ? t.outOfStock : incomplete ? t.chooseOption : t.inStock}
            </span>
          </div>
        </div>

        {variable && variants.length ? (
          <div style={{ marginBottom: 16 }}>
            <VariantSelector
              variants={variants}
              selection={selection}
              canBackorder={canBackorder}
              onSelect={(next) => {
                setPicked(next);
                setQty(1);
              }}
            />
          </div>
        ) : null}

        {paused ? (
          <OrdersPausedNotice paused={paused} />
        ) : (
          <>
            <QtyStepper
              label={t.quantity}
              qty={qty}
              setQty={setQty}
              availableQty={availableQty}
              canBackorder={canBackorder}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
              <button
                type="button"
                disabled={blocked}
                onClick={() => onAdd(line())}
                style={sheetBtn(false, blocked)}
              >
                {soldOut ? t.outOfStock : t.addToCartFull}
              </button>
              <button
                type="button"
                disabled={blocked}
                onClick={() => onBuy(line())}
                style={sheetBtn(true, blocked)}
              >
                {t.buyNow}
              </button>
            </div>
          </>
        )}

        {/* The escape hatch: quick buy is a shortcut, never a replacement for
            the description, gallery and specs the PDP carries. */}
        <Link
          href={storeHref(base, `/products/${product.slug}`)}
          style={{
            display: "block",
            textAlign: "center",
            marginTop: 14,
            padding: 8,
            fontSize: 12.5,
            color: "var(--muted)",
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          {t.fullDetails}
        </Link>
      </div>
    </div>
  );
}

function sheetBtn(primary: boolean, disabled: boolean) {
  return {
    fontFamily: "inherit",
    fontSize: 14,
    fontWeight: primary ? 700 : 600,
    padding: "14px 10px",
    minHeight: 48,
    borderRadius: 9,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    background: primary ? "var(--primary)" : "transparent",
    color: primary ? "var(--on-primary)" : "var(--text)",
    border: primary ? "none" : "1px solid var(--border-strong)",
  } as const;
}
