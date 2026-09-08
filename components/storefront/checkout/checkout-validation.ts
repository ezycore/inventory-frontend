// coding-standard: maintained

import type { Dict } from "@/lib/storefront-i18n";
import type { GeoValue } from "@/components/storefront/checkout/geo-picker";

/**
 * What a checkout is allowed to complain about, and when.
 *
 * Split out of `use-checkout` for one reason: **this is a pure function of the
 * form state**, so it is the part that can be reasoned about (and tested)
 * without a store, a cart or a signed-in shopper. The hook owns *when* a message
 * becomes visible; this file owns *whether there is one at all*.
 *
 * The rules here are the same ones `use-checkout` already used to compute
 * `addressComplete` — they were only ever expressed as booleans, which is why a
 * shopper missing a district saw a dead button and no reason for it. Same rules,
 * now able to say what they want. **If you change a rule, change it here only**;
 * `addressComplete` is derived from this, not computed alongside it.
 */

/**
 * Every field a checkout can refuse. `form` is the non-field-bound refusal.
 *
 * `zoneChoice` is the Inside/Outside question flat address mode asks when the
 * typed address places nothing. `custom:<key>` is one of the merchant's own
 * required fields — open-ended because the merchant defines them, which is why
 * `CheckoutErrors` widens to a string key rather than staying a closed record.
 */
export type CheckoutField =
  | "name"
  | "phone"
  | "address"
  | "district"
  | "area"
  | "zoneChoice"
  | "terms";

export type CheckoutErrors = Partial<Record<CheckoutField, string>> &
  Record<string, string | undefined>;

export interface CheckoutValidationInput {
  t: Dict;
  addr: { name: string; phone: string; address: string };
  geo: GeoValue;
  /** The merchant's `checkout.requiredFields` set (admin Store Settings). */
  required: Set<string>;
  /** Zone shipping forces district+area regardless of the merchant's config. */
  needArea: boolean;
  /** Pickup drops the whole delivery address. */
  isPickup: boolean;
  /** A guest's phone is their identity, so it is validated, not just filled. */
  phoneUsable: boolean;
  /** True only for a guest whose typed phone fails the BD rule. */
  phoneMalformed: boolean;
  termsRequired: boolean;
  termsAccepted: boolean;
}

/**
 * The order fields are reported in — which is also the order they are focused
 * in on a refused submit, so it must match the visual order of the form.
 */
export const CHECKOUT_FIELD_ORDER: CheckoutField[] = [
  "name",
  "phone",
  "address",
  "district",
  "area",
  "zoneChoice",
  "terms",
];

/**
 * Which fields each step of the STEPPED layout is answerable for.
 *
 * ⚠ **This must match `SteppedCheckout`'s block placement.** A field listed
 * against a step that does not render it becomes a step the shopper can never
 * leave and can see no way to fix — which is exactly what shipped: `terms`
 * renders in step 3, an unticked required box is an error from the first render,
 * and an unscoped advance check therefore refused step 1 while pointing at a
 * control two screens away. Terms and the minimum order are **final-submit**
 * concerns; they never gate an earlier step.
 *
 * Step 2 is payment, which is always valid — one method is always selected — so
 * it owns no fields rather than being special-cased at the call site.
 */
export const CHECKOUT_STEP_FIELDS: Record<number, readonly CheckoutField[]> = {
  1: ["name", "phone", "address", "district", "area", "zoneChoice"],
  2: [],
  3: ["terms"],
};

/**
 * The step that renders a given field — the inverse of `CHECKOUT_STEP_FIELDS`.
 *
 * A stepped layout's final submit checks EVERY field, but only one screen is
 * mounted, so a refusal can name a field the shopper cannot see. This is what
 * lets the submit jump to the screen that owns the problem first. Falls back to
 * step 1, which is where the fields a shopper can actually be missing live.
 */
export function stepForField(field: CheckoutField): number {
  // The merchant's own fields render inside the delivery block, so they belong
  // to whichever step owns the address — step 1.
  if (String(field).startsWith("custom:")) return 1;
  const hit = Object.entries(CHECKOUT_STEP_FIELDS).find(([, fields]) =>
    fields.includes(field),
  );
  return hit ? Number(hit[0]) : 1;
}

export function checkoutErrors({
  t,
  addr,
  geo,
  required,
  needArea,
  isPickup,
  phoneUsable,
  phoneMalformed,
  termsRequired,
  termsAccepted,
}: CheckoutValidationInput): CheckoutErrors {
  const errors: CheckoutErrors = {};

  if (required.has("name") && !addr.name.trim()) errors.name = t.nameRequired;

  // Two distinct phone failures. "Enter your number" and "that is not a
  // Bangladeshi mobile" are different problems with different fixes, and
  // collapsing them sends someone who typed a landline looking for a blank field.
  if (!addr.phone.trim()) {
    if (required.has("phone")) errors.phone = t.phoneRequired;
  } else if (phoneMalformed || !phoneUsable) {
    errors.phone = t.phoneInvalid;
  }

  // Pickup has no delivery address to be wrong about.
  if (!isPickup) {
    if (required.has("address") && !addr.address.trim()) {
      errors.address = t.addressRequired;
    }
    if (needArea) {
      if (!geo.district.trim()) errors.district = t.districtRequired;
      // Area is only askable once a district narrows the suggestion list, so it
      // is not "missing" until one is picked — flagging it first is flagging a
      // field the shopper cannot yet fill.
      else if (!geo.area.trim()) errors.area = t.areaRequired;
    }
  }

  if (termsRequired && !termsAccepted) errors.terms = t.termsRequiredError;

  return errors;
}

/**
 * First field in visual order that has a message — what to focus and scroll to.
 *
 * `scope` narrows it to the fields currently on screen. Order always comes from
 * `CHECKOUT_FIELD_ORDER`, never from the scope array, so a caller cannot
 * accidentally change which problem the shopper is sent to first.
 */
export function firstInvalidField(
  errors: CheckoutErrors,
  scope?: readonly CheckoutField[],
): CheckoutField | null {
  const order = scope
    ? CHECKOUT_FIELD_ORDER.filter((field) => scope.includes(field))
    : CHECKOUT_FIELD_ORDER;
  const known = order.find((field) => errors[field]);
  if (known) return known;
  // The merchant's own fields (`custom:<key>`) cannot appear in a fixed list —
  // the merchant invents them. Without this they were set on `errors`, rendered
  // beside their input, and then IGNORED by the submit: `reveal()` found nothing
  // to refuse and let the order through to be rejected by the SERVER instead.
  // They sort after the built-ins because that is where they render — inside the
  // delivery block, which is why a scoped call recognises them by that step
  // rather than by a list nobody can write down in advance.
  if (scope && !scope.includes("address")) return null;
  const custom = Object.keys(errors)
    .filter((key) => key.startsWith("custom:") && errors[key])
    .sort();
  return (custom[0] as CheckoutField | undefined) ?? null;
}
