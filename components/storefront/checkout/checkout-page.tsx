"use client";
// coding-standard: maintained

import type { CSSProperties } from "react";
import Link from "next/link";
import type { StoreTemplates } from "@/lib/storefront-client";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStore } from "@/services/storefront/hooks";
import { useStoreTemplate } from "@/services/stores/use-sf-preview-store";
import { storeHref } from "@/lib/storefront-links";
import { primaryLink } from "@/components/storefront/checkout/checkout-bits";
import { VerifyEmailGate } from "@/components/storefront/verify-email-gate";
import { LoadingSplash } from "@/components/storefront/loading-splash";
import { OrderPlacedCard } from "@/components/storefront/checkout/order-placed-card";
import { useCheckout } from "@/components/storefront/checkout/use-checkout";
import { SingleCheckout } from "@/components/storefront/checkout/layouts/single-checkout";
import { SteppedCheckout } from "@/components/storefront/checkout/layouts/stepped-checkout";
import { GuidedCheckout } from "@/components/storefront/checkout/layouts/guided-checkout";
import { EditorialCheckout } from "@/components/storefront/checkout/layouts/editorial-checkout";
import { useOrdersPaused } from "@/services/storefront/use-orders-paused";
import { OrdersPausedNotice } from "@/components/storefront/orders-paused-notice";
import { PreviewCartNotice } from "@/components/storefront/preview-cart-notice";

/**
 * A screen tall in every branch, so the store footer starts below the fold and
 * stays there. Checkout renders nothing real before hydration, and what replaces
 * the splash is either the tall form or a two-line empty-cart message: with no
 * reserved height the footer sat in view and hydration moved it — down for the
 * form, up for the empty cart (0.138 on a phone, measured; budget 0.1).
 */
const wrap: CSSProperties = {
  maxWidth: 940,
  margin: "0 auto",
  width: "100%",
  minHeight: "100svh",
  padding: "22px var(--pad) 40px",
};

/**
 * Checkout — the gates, then **one of four whole layouts** chosen by
 * `templates.checkout`.
 *
 * The split, which matters more here than on any other page:
 *
 * - **`useCheckout` owns every rule** — shipping zones, the coupon quote, the BD
 *   phone check, the merchant's required-field config, the minimum-order gate,
 *   the terms-page resolution, the address-book prefill and the submit itself.
 * - **The layouts own only the arrangement.** They may differ in how many
 *   screens they use; they may not differ in what an order costs or in when the
 *   form is complete.
 *
 * The gates below stay HERE rather than in the layouts, and that is deliberate:
 * hydration, email verification, the placed-order card and the empty cart are
 * all answers to "should a checkout render at all", so a layout that got one
 * wrong would be a layout that takes an order it should have refused.
 *
 * In the page editor's frame the basket may be the preview's own sample
 * (`usePreviewCart`, applied in `useCheckout`): without it the empty-cart branch
 * below is what a merchant designing their checkout page sees, every time. The
 * form it draws is the real one, and `submit` refuses inside a preview.
 *
 * `checkout` was widened from two values to four rather than gaining a parallel
 * `checkoutLayout` key — merchants already have `single-page`/`multi-step`
 * saved, and the two extra ids are purely additive.
 */
/**
 * Which screens hide the coupon field. Both answers travel together and CSS
 * picks — see `sf-nocoupon-d` / `sf-nocoupon-m` in `storefront.css`. Absent on
 * the classic `/checkout` route, which has no section to carry the setting.
 */
export interface HideCoupon {
  desktop: boolean;
  mobile: boolean;
}

export function CheckoutPageView({
  layout: chosen,
  hideCoupon,
}: {
  layout?: StoreTemplates["checkout"];
  hideCoupon?: HideCoupon;
}) {
  const { slug, base } = useStoreContext();
  const { data: store } = useStore(slug);
  const api = useCheckout();
  const { t, hydrated, shopper, placed, items } = api;

  const paused = useOrdersPaused();

  /* The store's own choice, and — once the checkout page is on the builder —
     the core section's, which wins when the merchant has set one. `chosen` is
     unset on every page built by the migration, so a moved checkout draws the
     layout the store already drew. */
  const stored = useStoreTemplate(store, "checkout") as StoreTemplates["checkout"];
  const variant = chosen ?? stored;
  const Layout = CHECKOUT_LAYOUTS[variant] ?? SingleCheckout;

  // ----- gates -----
  // Only one gate is about the persisted session loading — NOT about having an
  // account. Rendering before hydration would flash the guest form at a signed-in
  // shopper and lose their saved addresses.
  if (!hydrated) {
    return (
      <div style={wrap}>
        <LoadingSplash />
      </div>
    );
  }

  // Paused orders: the page stays (a 404 here would strand every open cart and
  // Buy link), and says what the merchant wrote. The order API refuses anyway.
  if (paused && !placed) {
    return (
      <div style={wrap}>
        <h1 style={{ fontSize: "var(--h2)", fontWeight: 700, marginBottom: 12 }}>{t.checkout}</h1>
        <OrdersPausedNotice paused={paused} />
      </div>
    );
  }

  // The verification gate still has teeth for shoppers who HAVE an account — it
  // protects the accounts that exist. A guest has no email to verify, so gating
  // them on it would be gating them on nothing.
  if (shopper && !shopper.emailVerified && !placed) {
    return (
      <div style={wrap}>
        <VerifyEmailGate />
      </div>
    );
  }

  if (placed) {
    return (
      <div style={wrap}>
        <OrderPlacedCard order={placed} base={base} t={t} isGuest={!shopper} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={wrap}>
        <h1 style={{ fontSize: "var(--h2)", fontWeight: 700, marginBottom: 12 }}>{t.checkout}</h1>
        <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 14 }}>{t.emptyCartMsg}</p>
        <Link href={storeHref(base, "/products")} style={primaryLink}>
          {t.viewAllProducts}
        </Link>
      </div>
    );
  }

  return (
    // See `cart-page.tsx`: the sample's fields and buttons stay live inside the
    // page editor's frame, where every other click is captured for selection.
    // A checkout a merchant cannot fill is a checkout they cannot judge, and
    // `submit` refuses a preview anyway.
    //
    // The coupon classes go HERE rather than on the row: all four layouts draw
    // their own `CouponRow`, in their own place, so one wrapper is the only
    // spot that covers every one of them without threading a prop through four
    // files — and it is the same two-class, one-per-breakpoint shape the banner
    // cards use (`sf-banner-card--notext-d/-m`).
    <div
      style={wrap}
      className={couponClass(hideCoupon)}
      data-preview-interactive={api.sampleCart ? "" : undefined}
    >
      {api.sampleCart ? <PreviewCartNotice text={t.previewSampleCart} /> : null}
      <Layout api={api} />
    </div>
  );
}

/** The hiding classes for this checkout, or undefined where nothing hides. */
function couponClass(hide?: HideCoupon): string | undefined {
  if (!hide?.desktop && !hide?.mobile) return undefined;
  return [hide.desktop ? "sf-nocoupon-d" : "", hide.mobile ? "sf-nocoupon-m" : ""]
    .filter(Boolean)
    .join(" ");
}

const CHECKOUT_LAYOUTS: Record<
  StoreTemplates["checkout"],
  typeof SingleCheckout
> = {
  single: SingleCheckout,
  multi: SteppedCheckout,
  guided: GuidedCheckout,
  editorial: EditorialCheckout,
};
