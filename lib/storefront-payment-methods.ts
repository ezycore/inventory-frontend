// coding-standard: maintained

import type { StorefrontPaymentMethod } from "@/types";

/**
 * The payment methods the storefront ships, and what the ADMIN calls them.
 *
 * A fixed set, not merchant data: the id lands on every order and keys
 * `paymentAccountMap`, so a renameable one would rewrite history and unhook the
 * receiving account. Adding bKash, Nagad or Rocket is a line here plus a line in
 * the backend's `STOREFRONT_PAYMENT_METHODS` — and nothing else, because the
 * payment toggles and the checkout-field condition both read this list.
 *
 * Shopper-facing wording is NOT here: that is translated, and lives in
 * `storefront-i18n.ts` (`t.cod`, `t.bankTransfer`). These labels are for the
 * merchant, in the admin, which is English-only.
 */
export const PAYMENT_METHOD_OPTIONS: {
  value: StorefrontPaymentMethod;
  label: string;
}[] = [
  { value: "cod", label: "Cash on Delivery" },
  { value: "bank", label: "Bank / Manual transfer" },
];

export const paymentMethodLabel = (value: string): string =>
  PAYMENT_METHOD_OPTIONS.find((m) => m.value === value)?.label ?? value;
