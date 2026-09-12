// coding-standard: maintained

import { STOREFRONT_PAYMENT_ICONS, type StorefrontPaymentIcon } from "@/types";

/**
 * The least a caller must hand over to get a label back.
 *
 * Structural rather than `StorefrontPaymentMethodDef` because the wire type keeps
 * `icon` as a plain `string` — the server may send a value this build does not
 * know, and a label lookup has no business caring.
 */
type PaymentMethodLike = { id: string; title: string; subtitle?: string };

/**
 * Resolving what to CALL a payment method — the only hard part of methods being
 * merchant data.
 *
 * An id is permanent; a title is not. A merchant can rename bKash to Nagad, or
 * delete the method outright, long after an order was placed. So a label is read
 * from the most specific source that still exists, and only then falls back:
 *
 *   1. the order's own `paymentMethodTitle` snapshot — frozen at order time, and
 *      the only source that survives a rename or a deletion
 *   2. the store's current definition — the right answer for a live checkout,
 *      where there is no order yet to have snapshotted anything
 *   3. the translated dictionary, for `cod` and legacy `bank`, whose wording
 *      belongs to the storefront and follows the shopper's language
 *   4. the raw id, so a method nobody can explain still renders as something
 *
 * Step 3 is why `cod` and `bank` are deliberately NOT snapshotted onto orders:
 * pinning one language's string would break the other language's invoice.
 */

export interface PaymentMethodLabels {
  cod: string;
  bankTransfer: string;
  customPayment: string;
}

/**
 * Shopper-facing wording for a method id.
 *
 * `snapshotTitle` is an order's frozen title and wins outright when present —
 * that is the entire reason it is stored.
 */
export const storefrontPaymentMethodLabel = (
  id: string,
  labels: PaymentMethodLabels,
  methods?: PaymentMethodLike[],
  snapshotTitle?: string,
): string => {
  const snapshot = snapshotTitle?.trim();
  if (snapshot) return snapshot;

  const defined = methods?.find((m) => m.id === id)?.title?.trim();
  if (defined) return defined;

  if (id === "cod") return labels.cod;
  if (id === "bank") return labels.bankTransfer;
  if (id === "manual") return labels.customPayment;
  return id;
};

/** The subtitle under a method in the checkout picker, when the merchant wrote one. */
export const storefrontPaymentMethodSubtitle = (
  id: string,
  methods?: PaymentMethodLike[],
): string | undefined => methods?.find((m) => m.id === id)?.subtitle?.trim() || undefined;

/**
 * Admin-side label for a method id — the back office, not the storefront.
 *
 * Same precedence, minus translation: the admin UI is English-only, and a
 * merchant reading their own order list should see their own wording rather than
 * a platform word for it.
 */
export const adminPaymentMethodLabel = (
  id: string,
  methods?: PaymentMethodLike[],
  snapshotTitle?: string,
): string => {
  const snapshot = snapshotTitle?.trim();
  if (snapshot) return snapshot;

  const defined = methods?.find((m) => m.id === id)?.title?.trim();
  if (defined) return defined;

  if (id === "cod") return "COD";
  // `manual` is the admin order path's own id: a payment a human recorded.
  if (id === "manual") return "Manual";
  if (id === "bank") return "Bank";
  return id;
};

/**
 * Which mark to draw for a method id.
 *
 * Falls back to `card` for three separate cases that all mean the same thing to a
 * shopper — the merchant never picked one, they picked one this build has since
 * dropped, or the id belongs to no definition at all. A payment row with a blank
 * space where an icon should be reads as broken, so there is no "no icon" answer.
 */
export const storefrontPaymentIcon = (
  id: string,
  methods?: { id: string; icon?: string }[],
): StorefrontPaymentIcon | "coins" => {
  // The two we ship keep their own marks: COD is money in hand, and `bank` is a
  // bank until a merchant says otherwise.
  const chosen = methods?.find((m) => m.id === id)?.icon;
  if (chosen && (STOREFRONT_PAYMENT_ICONS as readonly string[]).includes(chosen)) {
    return chosen as StorefrontPaymentIcon;
  }
  if (id === "cod") return "coins";
  if (id === "bank") return "bank";
  return "card";
};