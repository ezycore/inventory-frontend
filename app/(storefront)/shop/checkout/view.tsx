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

const wrap: CSSProperties = {
  maxWidth: 940,
  margin: "0 auto",
  width: "100%",
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
 * `checkout` was widened from two values to four rather than gaining a parallel
 * `checkoutLayout` key — merchants already have `single-page`/`multi-step`
 * saved, and the two extra ids are purely additive.
 */
export default function CheckoutPage() {
  const { slug, base } = useStoreContext();
  const { data: store } = useStore(slug);
  const api = useCheckout();
  const { t, hydrated, shopper, placed, items } = api;

  const variant = useStoreTemplate(store, "checkout") as StoreTemplates["checkout"];
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
    <div style={wrap}>
      <Layout api={api} />
    </div>
  );
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
