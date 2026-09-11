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
 * Which step each merchant-defined slot renders on, for the STEPPED layout.
 *
 * ⚠ Same contract as `CHECKOUT_STEP_FIELDS`, and the same failure if it drifts:
 * a required field mapped to a step that does not render it is a step the
 * shopper can never leave. Read this against `SteppedCheckout` — address is
 * step 1, payment is step 2, review + terms are step 3 — and against where
 * `CustomFields` is anchored in the blocks.
 *
 * The three single-screen layouts never consult it; everything is mounted.
 */
export const CHECKOUT_SLOT_STEP: Record<CheckoutFieldSlot, number> = {
  "after-contact": 1,
  "after-address": 1,
  "before-payment": 2,
  "after-payment": 2,
  "before-submit": 3,
};

/** The checkout anchors a merchant may place one of their own fields against. */
export type CheckoutFieldSlot =
  | "after-contact"
  | "after-address"
  | "before-payment"
  | "after-payment"
  | "before-submit";

/**
 * The slot a field renders in. Unset reads as `after-address`, which is where
 * every custom field rendered before slots existed — so a store that never
 * opens the setting keeps the checkout it has.
 */
export const slotOf = (field: { slot?: CheckoutFieldSlot }): CheckoutFieldSlot =>
  field.slot ?? "after-address";

/** What a `showWhen` is judged against — the shopper's live choices. */
export interface CheckoutVisibilityContext {
  paymentMethod?: string;
}

/**
 * Whether a merchant-defined entry is on screen for these choices.
 *
 * **A deliberate literal port of the backend's `isCheckoutFieldVisible`**
 * (`utils/checkout-address.ts`), for the same reason `lib/bd-zone.ts` mirrors
 * the server's zone rule: the form decides what to render and what to refuse,
 * the server decides what to require and what to store, and if the two disagree
 * the shopper meets the worst failure a checkout has — a form that accepts an
 * order the server then rejects, naming a field that was never on the page.
 *
 * Unset, empty, or no context means visible: every field saved before conditions
 * existed carries no `showWhen`, and those must not start disappearing.
 */
export function isCheckoutFieldVisible(
  field: { showWhen?: { paymentMethods?: string[] } },
  context?: CheckoutVisibilityContext,
): boolean {
  const methods = field.showWhen?.paymentMethods;
  if (!methods?.length) return true;
  if (!context?.paymentMethod) return true;
  return methods.includes(context.paymentMethod);
}

/**
 * The step that renders a given field — the inverse of `CHECKOUT_STEP_FIELDS`.
 *
 * A stepped layout's final submit checks EVERY field, but only one screen is
 * mounted, so a refusal can name a field the shopper cannot see. This is what
 * lets the submit jump to the screen that owns the problem first. Falls back to
 * step 1, which is where the fields a shopper can actually be missing live.
 */
export function stepForField(
  field: CheckoutField,
  /**
   * Slot per custom-field key, for `custom:<key>` errors. Omitted, every custom
   * field is assumed to sit where they all used to — step 1.
   */
  slots?: Readonly<Record<string, CheckoutFieldSlot>>,
): number {
  // The merchant's own fields render wherever the merchant anchored them, which
  // is a slot, which is a step. Before slots they were all in the delivery
  // block, so an unmapped key still answers step 1.
  if (String(field).startsWith("custom:")) {
    const slot = slots?.[String(field).slice("custom:".length)];
    return slot ? CHECKOUT_SLOT_STEP[slot] : 1;
  }
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
  /**
   * The merchant's own field keys that are on screen, in the order they render.
   *
   * Passing it is what lets a scoped call be right about custom fields once they
   * can be anchored anywhere: a slot puts them on any of the three steps, so
   * "is `address` in scope?" stopped being a usable proxy for "are the custom
   * fields in scope?". Omitted, the pre-slot behaviour stands — every custom
   * field counts as living with the address.
   */
  customKeys?: readonly string[],
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
  if (customKeys) {
    const hit = customKeys.find((key) => errors[`custom:${key}`]);
    return hit ? (`custom:${hit}` as CheckoutField) : null;
  }
  // No list given: the pre-slot rule. They sorted after the built-ins because
  // that is where they rendered — inside the delivery block — which is why a
  // scoped call recognised them by that step.
  if (scope && !scope.includes("address")) return null;
  const custom = Object.keys(errors)
    .filter((key) => key.startsWith("custom:") && errors[key])
    .sort();
  return (custom[0] as CheckoutField | undefined) ?? null;
}
