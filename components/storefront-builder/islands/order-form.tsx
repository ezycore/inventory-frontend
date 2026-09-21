"use client";
// coding-standard: maintained

import { useMemo, useState, type CSSProperties } from "react";
import type { CatalogProduct } from "@/lib/storefront-client";
import { useStoreProduct } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { money } from "@/components/storefront/format";
import { Media } from "@/components/storefront/sf-bits";
import { thumbImageUrl } from "@/lib/storefront-image";
import { VariantSelector } from "@/components/storefront/variant-selector";
import { QtyStepper } from "@/components/storefront/qty-stepper";
import { VerifyEmailGate } from "@/components/storefront/verify-email-gate";
import { choiceLine, resolveProductChoice } from "@/components/storefront/product-choice";
import { useCheckout } from "@/components/storefront/checkout/use-checkout";
import { OrderPlacedCard } from "@/components/storefront/checkout/order-placed-card";
import { useOrdersPaused } from "@/services/storefront/use-orders-paused";
import { OrdersPausedNotice } from "@/components/storefront/orders-paused-notice";
import {
  ContactFields,
  CouponRow,
  DeliveryFields,
  FulfillmentToggle,
  PaymentBlock,
  PlaceOrderButton,
  SummaryLines,
  TermsBlock,
} from "@/components/storefront/checkout/checkout-blocks";

/**
 * A landing page's order form (backend plan storefront-builder §9): the section's
 * product, its options and quantity, and the store's own checkout — placed on
 * the page, with no hop to /checkout, which on a phone is a second page load.
 *
 * Built from what checkout already is: `useCheckout` with explicit `lines`, so
 * the shipping zones, required fields, custom fields, terms, minimum order and
 * the submit are the checkout page's exactly, and the shopper's cart is left
 * alone. Options resolve through `resolveProductChoice`, the product page's own
 * rule. Loaded only through the island map.
 */
export function OrderFormIsland({
  product: listed,
  coupon = false,
  buttonLabel,
}: {
  product: CatalogProduct;
  coupon?: boolean;
  /** The merchant's own words for the submit; unset keeps the storefront's. */
  buttonLabel?: string;
}) {
  const { slug } = useStoreContext();
  const paused = useOrdersPaused();
  // The list row the section was drawn with carries no variants; a variable
  // product waits for the detail payload before it can offer a choice.
  const variable = listed.productType === "variable";
  const { data: detail } = useStoreProduct(slug, variable ? listed.slug : "");
  const product = detail ?? listed;

  const [picked, setPicked] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const choice = resolveProductChoice(product, picked);
  const orderable =
    !choice.soldOut && !choice.incomplete && !(choice.variable && choice.selected?.price == null);
  const lines = useMemo(
    () => (orderable ? [choiceLine(product, resolveProductChoice(product, picked), qty)] : []),
    [orderable, product, picked, qty],
  );

  const api = useCheckout({ lines });
  const { t, base, currency, placed, shopper, hydrated } = api;

  if (placed) return <OrderPlacedCard order={placed} base={base} t={t} isGuest={!shopper} />;
  if (paused) return <OrdersPausedNotice paused={paused} />;
  if (variable && !detail) return <div style={{ minHeight: 320 }} />;

  return (
    <div style={card}>
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
        <div style={{ width: 72, height: 72, flex: "none" }}>
          <Media src={thumbImageUrl(choice.images[0])} alt={product.name} label="product" radius={10} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>{product.name}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginTop: 4 }}>
            <span className="sf-mono" style={{ fontSize: 17, fontWeight: 700 }}>
              {money(choice.price, currency)}
            </span>
            {choice.hasOld ? (
              <span style={{ fontSize: 13, color: "var(--faint)", textDecoration: "line-through" }}>
                {money(choice.compareAt, currency)}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {choice.variable && choice.variants.length ? (
        <VariantSelector
          variants={choice.variants}
          selection={choice.selection}
          canBackorder={choice.canBackorder}
          onSelect={(next) => {
            setPicked(next);
            setQty(1);
          }}
        />
      ) : null}

      {!orderable ? (
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--discount)" }}>
          {choice.soldOut ? t.outOfStock : t.chooseOption}
        </p>
      ) : (
        <>
          <QtyStepper
            label={t.quantity}
            qty={qty}
            setQty={setQty}
            availableQty={choice.availableQty}
            canBackorder={choice.canBackorder}
          />
          {/* Rendered after hydration only, like the checkout page: the form
              prefills from the persisted shopper session, which the server
              cannot see. */}
          {!hydrated ? null : shopper && !shopper.emailVerified ? (
            <VerifyEmailGate />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <ContactFields api={api} />
              <FulfillmentToggle api={api} />
              <DeliveryFields api={api} />
              <PaymentBlock api={api} />
              {coupon ? <CouponRow api={api} /> : null}
              <SummaryLines api={api} />
              <TermsBlock api={api} />
              <PlaceOrderButton api={api} label={buttonLabel} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

const card: CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  padding: 20,
};
