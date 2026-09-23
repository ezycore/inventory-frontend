"use client";
// coding-standard: maintained

import { useMemo, useRef, useState } from "react";
import { toast } from "@/lib/storefront-toast";
import {
  usePlaceOrder,
  useShopperAccount,
  useStore,
  useStorePages,
} from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useCartStore, type CartItem } from "@/services/stores/use-cart-store";
import { useShopperStore } from "@/services/stores/use-shopper-store";
import { storefrontApi } from "@/lib/storefront-client";
import type {
  ShopperAddress,
  ShippingAddress,
  StorefrontOrder,
} from "@/lib/storefront-client";
import {
  computeShipping,
  hasZoneShipping,
  zoneForDistrict,
  type Zone,
} from "@/lib/storefront-shipping";
import { inferZone } from "@/lib/bd-zone";
import { money } from "@/components/storefront/format";
import { useHydrated } from "@/hooks/use-hydrated";
import { useGuestContactCapture } from "@/hooks/use-guest-contact-capture";
import { cartAnonymousId, isSfPreview } from "@/services/storefront/cart-identity";
import { usePreviewCart } from "@/services/storefront/use-preview-cart";
import { metaCheckoutAttribution, trackMetaPurchase } from "@/lib/storefront-meta";
import { orderSource } from "@/lib/storefront-attribution";
import { useInitiateCheckout } from "@/components/storefront/checkout/use-initiate-checkout";
import { canonicalizeBdPhone, isValidBdPhone } from "@/services/storefront/bd-phone";
import type { GeoValue } from "@/components/storefront/checkout/geo-picker";
import {
  CHECKOUT_SLOT_STEP,
  CHECKOUT_STEP_FIELDS,
  checkoutErrors,
  firstInvalidField,
  isCheckoutFieldVisible,
  slotOf,
  stepForField,
  type CheckoutErrors,
  type CheckoutFieldSlot,
} from "@/components/storefront/checkout/checkout-validation";
import { useCheckoutErrors } from "@/components/storefront/checkout/use-checkout-errors";

const emptyGeo = (): GeoValue => ({ district: "", area: "" });

/**
 * Everything checkout DOES, with nothing about how it looks.
 *
 * **This is the most load-bearing hook in the storefront.** Four layouts render
 * four different checkouts, and every one of them runs this: the shipping-zone
 * pricing, the coupon quote, the phone rule, the merchant's required-field
 * config, the minimum-order gate, the terms-page resolution, the address-book
 * prefill, and the order submission itself. A bug in any of those is fixed once.
 *
 * If a layout ever needs "just a small change" to one of these, the change goes
 * here and every layout gets it. **A layout that computes its own total, or its
 * own idea of when the form is complete, is a bug waiting to be reported as
 * "the price changed at the last step".**
 *
 * Layouts own: the arrangement, the number of screens, the chrome. Nothing else.
 *
 * **`lines`** orders those instead of the cart — a landing page's order form
 * (plan storefront-builder §9). Everything above still applies; what changes is
 * only what belongs to the cart: the basket is neither read nor emptied, no
 * mirrored cart is closed, and `InitiateCheckout` waits for the first edit.
 */
export function useCheckout({ lines }: { lines?: CartItem[] } = {}) {
  const { slug, base } = useStoreContext();
  const { t, lang } = useStorefrontUI();
  const { data: store } = useStore(slug);
  const placeOrder = usePlaceOrder(slug);
  const account = useShopperAccount(slug);

  const shopper = useShopperStore((s) => s.shopper);
  const token = useShopperStore((s) => s.token);
  const hydrated = useHydrated();

  // GUEST CHECKOUT: no sign-in wall. A shopper who is signed in gets their saved
  // addresses and profile prefill; everyone else fills the form and orders. The
  // account is post-purchase value (order history, saved addresses), and it is
  // never worth more than the order — so it never gates one.
  const storeSlug = useCartStore((s) => s.storeSlug);
  const allItems = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);

  const cartItems = storeSlug === slug ? allItems : [];
  /* The editor's frame again — see `useCartPage`. A checkout previewed with an
     empty basket renders two lines of text where the whole form belongs, so the
     layout picker on the `checkout-form` section changes nothing on screen. Off
     for a landing page's form, which brings its own `lines`. */
  const preview = usePreviewCart(cartItems, !lines);
  const items = lines ?? preview?.items ?? cartItems;
  const currency = store?.currency;
  const methods = store?.allowedPaymentMethods ?? ["cod"];
  const savedAddresses = shopper?.addresses ?? [];

  const [addr, setAddr] = useState({ name: "", phone: "", address: "", notes: "" });
  const set = (k: keyof typeof addr, v: string) => {
    // A form on a landing page starts its checkout when the shopper starts typing.
    if (lines) reportCheckout();
    setAddr((a) => ({ ...a, [k]: v }));
  };
  // Merchant visibility only (abandoned carts), guests only, fire-and-forget —
  // a shopper who fills this form and leaves is otherwise unreachable.
  const captureContact = useGuestContactCapture(slug, !shopper);
  // Which saved address is selected (null + isNew → the shopper is entering a new one).
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saveNew, setSaveNew] = useState(true);
  const [geo, setGeo] = useState<GeoValue>(emptyGeo);
  // Answers to the merchant's own checkout fields, keyed by field key. Inert
  // labelled data — the server stores it on the order and never prices it.
  const [customFieldAnswers, setCustomFieldAnswers] = useState<Record<string, string>>({});

  // Prefill from the shopper profile once it's available — on a hard load the
  // persisted store serves its empty initial snapshot through the hydration
  // render, so a mount-time initializer would miss it (render-time adjust).
  const [prefilled, setPrefilled] = useState(false);
  if (shopper && !prefilled) {
    setPrefilled(true);
    const def =
      savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0] ?? null;
    if (def) {
      setSelectedId(def.id ?? null);
      setIsNew(false);
      setAddr((a) => ({
        ...a,
        name: a.name || (shopper.name ?? ""),
        phone: def.phone || shopper.phone || "",
        address: def.line,
      }));
      setGeo({ district: def.district ?? "", area: def.area ?? "" });
    } else {
      setIsNew(true);
      setAddr((a) => ({
        ...a,
        name: a.name || (shopper.name ?? ""),
        phone: a.phone || (shopper.phone ?? ""),
      }));
    }
  }

  // A method id from the store's own list — nothing here can enumerate them.
  const [payment, setPayment] = useState<string>(methods[0]);
  const effectivePayment = methods.includes(payment) ? payment : methods[0];
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<{ code: string; discountAmount: number } | null>(null);
  const [applying, setApplying] = useState(false);
  const [step, setStep] = useState(1);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [placed, setPlaced] = useState<StorefrontOrder | null>(null);

  // Fulfillment: courier delivery (default) or in-store pickup (when the store
  // offers it). Pickup drops the whole delivery address + shipping fee.
  const pickupOffered = !!store?.pickup?.enabled;
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const isPickup = pickupOffered && fulfillment === "pickup";

  // How the merchant asks for the address. `flat` is one box; the zone that
  // prices the order is then inferred from the text (see `lib/bd-zone.ts`) and
  // the shopper is asked outright when the address places nothing.
  const addressMode = store?.checkout?.addressMode ?? "detailed";
  const isFlatAddress = addressMode === "flat";
  // The shopper's answer to the Inside/Outside question, set only when we had to
  // ask. Cleared whenever the address changes, so a stale answer cannot ride
  // along with a completely different address.
  const [zoneChoice, setZoneChoice] = useState<Zone | undefined>(undefined);

  const inference = useMemo(
    () => (isFlatAddress ? inferZone(addr.address) : undefined),
    [isFlatAddress, addr.address],
  );
  // Drop a stale answer when the address is rewritten: keeping it would price a
  // brand-new address by a question the shopper answered about the old one.
  const lastAddress = useRef(addr.address);
  if (lastAddress.current !== addr.address) {
    lastAddress.current = addr.address;
    if (zoneChoice) setZoneChoice(undefined);
  }
  // Ask only when the address is genuinely unplaceable — never as a default.
  const needsZoneChoice = !!inference && inference.confidence === "ambiguous";

  // Zone is derived from the picked district (detailed) or inferred (flat); the
  // shopper's own answer counts only where inference could not decide. The server
  // re-derives all of this at placeOrder and its answer is what is charged.
  const zone: Zone = isFlatAddress
    ? inference?.confidence === "high"
      ? inference.zone
      : (zoneChoice ?? "outside")
    : zoneForDistrict(geo.district);
  const zoned = hasZoneShipping(store);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  // Pickup has no courier, so no shipping charge.
  const shipping = isPickup ? 0 : computeShipping(store, subtotal, zone);
  const discount = applied?.discountAmount ?? 0;
  const total = Math.max(0, subtotal - discount) + shipping;
  const zoneLabel = zone === "inside" ? t.insideDhaka : t.outsideDhaka;

  // Meta `InitiateCheckout`: on arrival at the checkout page, on the first edit
  // in a landing page's order form — see `useInitiateCheckout`.
  const reportCheckout = useInitiateCheckout({ store, items, hydrated, onArrival: !lines });

  // --- address book selection ---
  const pickSaved = (a: ShopperAddress) => {
    setSelectedId(a.id ?? null);
    setIsNew(false);
    setAddr((prev) => ({
      ...prev,
      phone: a.phone || shopper?.phone || "",
      address: a.line,
    }));
    setGeo({ district: a.district ?? "", area: a.area ?? "" });
  };
  const pickNew = () => {
    setSelectedId(null);
    setIsNew(true);
    setAddr((prev) => ({ ...prev, phone: shopper?.phone || "", address: "" }));
    setGeo(emptyGeo());
  };

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setApplying(true);
    try {
      // No token is a guest preview, which the server accepts. The phone rides
      // along because it is what carries a per-buyer limit when there is no
      // account to count against — omit it and the quoted discount could differ
      // from the one actually charged.
      const res = await storefrontApi.validateCoupon(slug, token || undefined, {
        code: coupon.trim(),
        items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
        phone: addr.phone.trim() || undefined,
      });
      setApplied(res);
      toast.success(`${res.code} · ${money(res.discountAmount, currency)}`);
    } catch (e) {
      setApplied(null);
      toast.error((e as Error).message);
    } finally {
      setApplying(false);
    }
  };

  // Merchant-configured checkout rules (admin Store Settings → Checkout). Name
  // and phone are structurally required everywhere; address/area are toggleable.
  // The district/area pair is also forced whenever zone shipping is on, since it
  // prices the order — matches the backend enforcement in placeOrder.
  const required = new Set(
    store?.checkout?.requiredFields ?? ["name", "phone", "address"],
  );
  // Flat mode never shows a district/area pair, so it cannot require one — the
  // zone question below is its equivalent guard. Mirrors the backend's
  // `storefront-order-create.service.ts` check exactly.
  const needArea = !isFlatAddress && (required.has("area") || zoned);
  // A GUEST's phone is their identity, not just a contact detail — the server
  // rejects one it cannot normalise with `INVALID_PHONE`, so validate the same
  // rule here rather than letting them discover it at submit. A signed-in shopper
  // keeps the looser check: they are already identified by their account, and
  // tightening that is a separate change.
  const phoneUsable = shopper ? !!addr.phone.trim() : isValidBdPhone(addr.phone);
  const phoneMalformed = !shopper && !!addr.phone.trim() && !phoneUsable;

  const minOrder = store?.checkout?.minOrderValue ?? 0;
  const belowMin = minOrder > 0 && subtotal < minOrder;
  const termsRequired = !!store?.checkout?.termsRequired;

  // The terms checkbox links to the merchant's chosen CMS page; if none is set (or
  // it no longer resolves) fall back to a page slugged like "terms", else plain
  // text (no dead link). Only resolved when terms are actually required.
  const contentPages = useStorePages(slug).data ?? [];
  const explicitTermsSlug = store?.checkout?.termsPageSlug;
  const termsSlug = termsRequired
    ? explicitTermsSlug && contentPages.some((p) => p.slug === explicitTermsSlug)
      ? explicitTermsSlug
      : contentPages.find((p) => /^terms($|-)|^tos$|conditions$/i.test(p.slug))?.slug
    : undefined;

  // The merchant's own returns page, if they published one. Read ONLY by the
  // trust strip, and the reason that strip can exist at all: a white-label
  // checkout must not promise a returns window on behalf of a merchant who never
  // wrote one, so the claim and its wording both come from their CMS page.
  const returnsPage =
    contentPages.find((p) => /(^|-)(returns?|refunds?|exchanges?)($|-)/i.test(p.slug)) ?? null;

  // The single source of "what is wrong with this form". Completeness used to be
  // three booleans computed here; it is now derived from the same messages the
  // shopper reads, so the button and the errors can never disagree.
  const errors: CheckoutErrors = checkoutErrors({
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
  });
  // Two more blocking conditions, expressed as the same shape as the rest so the
  // place-order button and the messages can never disagree.
  if (!isPickup && isFlatAddress && zoned && needsZoneChoice && !zoneChoice) {
    errors.zoneChoice = t.zoneChoiceRequired;
  }
  const customFields = store?.checkout?.customFields ?? [];
  // Only the fields the shopper can actually SEE right now. A field scoped to
  // bank transfer must not refuse a cash-on-delivery order — that is an order
  // nobody can place, refused over a control that is not on the page.
  const visibleCustomFields = customFields.filter((field) =>
    isCheckoutFieldVisible(field, { paymentMethod: effectivePayment }),
  );
  const visibleCustomFieldAnswers: Record<string, string> = {};
  for (const field of visibleCustomFields) {
    if (field.kind === "input" && customFieldAnswers[field.key] !== undefined) {
      visibleCustomFieldAnswers[field.key] = customFieldAnswers[field.key];
    }
  }
  for (const field of visibleCustomFields) {
    if (field.kind !== "input" || !field.required) continue;
    if (!customFieldAnswers[field.key]?.trim()) {
      errors[`custom:${field.key}`] = t.fieldRequired;
    }
  }
  const errorState = useCheckoutErrors(errors);

  // Where each of the merchant's fields sits, in the two shapes the refusal
  // logic needs: key → slot for `stepForField`, and step → keys in render order
  // for a scoped `reveal`. Both are derived from the same array the blocks
  // render from, so a slot can never mean one place to the form and another to
  // the thing that refuses it.
  const customSlots: Record<string, CheckoutFieldSlot> = {};
  for (const field of visibleCustomFields) customSlots[field.key] = slotOf(field);
  const customKeysForStep = (n: number) =>
    visibleCustomFields
      .filter((field) => CHECKOUT_SLOT_STEP[slotOf(field)] === n)
      .map((field) => field.key);

  // Best-effort: remember the picked district/area on the chosen address (or save
  // a brand-new one), so the next checkout is pre-filled. Never blocks the order.
  const rememberAddress = () => {
    if (!token || isPickup) return; // pickup has no delivery address to remember
    const { district, area } = geo;
    if (!isNew && selectedId) {
      // Flat mode never fills `geo`, so writing it back would blank a district
      // the shopper had already saved — and that district is what a later
      // detailed-mode order, and the courier resolver, both read.
      if (isFlatAddress) return;
      account.updateAddress.mutate({ addressId: selectedId, district, area });
    } else if (isNew && saveNew && addr.address.trim()) {
      account.addAddress.mutate({
        label: addr.address.trim().slice(0, 38) || t.newAddress,
        line: addr.address.trim(),
        phone: canonicalizeBdPhone(addr.phone),
        // Omit rather than send "" so a flat-mode address is saved without a
        // location rather than with an empty one.
        district: isFlatAddress ? undefined : district,
        area: isFlatAddress ? undefined : area,
      });
    }
  };

  /**
   * Advance a stepped layout. Returns `false` and lights up step 1 rather than
   * sitting on a dead Continue button — the old `stepBlocked` disabled it, which
   * is the same silence this whole change is about.
   *
   * This one DOES toast, unlike `submit`: Continue has no banner beside it, so
   * without the toast a shopper who is already looking at a filled-in field sees
   * only a page that refused to move.
   *
   * It checks **only the current step's fields**. Checking all of them looks
   * stricter and is in fact a dead end: an unticked required-terms box lives on
   * step 3, so it refused step 1 and then pointed at a checkbox that had not
   * rendered yet. Terms still gate `submit`, which is where they belong.
   */
  const tryAdvance = () => {
    if (!errorState.reveal(CHECKOUT_STEP_FIELDS[step], customKeysForStep(step))) {
      toast.error(t.checkoutFixErrors);
      return false;
    }
    setStep(Math.min(3, step + 1));
    return true;
  };

  const submit = () => {
    // An admin preview frame draws the REAL checkout, so its Place order button
    // is the real one — and an order placed from it is a real order: stock moves,
    // a courier is booked, the merchant's own order list grows a parcel nobody
    // bought. Every other write on this path already refuses a preview
    // (`isSfPreview` guards the cart mirror, the guest-contact capture and every
    // Meta event); placement was the one that did not, and it is the expensive
    // one. Checked first, before any validation, so a half-filled form cannot
    // reach it by another route.
    if (isSfPreview()) {
      toast.error(t.previewNoOrder);
      return;
    }
    // The button is never disabled for an incomplete form: pressing it is how a
    // shopper ASKS what is missing, and a disabled button answers nothing. The
    // refusal happens here instead, and it says why.
    if (belowMin) {
      toast.error(`${t.minOrderNotice} ${money(minOrder, currency)}`);
      return;
    }
    // A stepped layout shows one screen at a time, and the final submit checks
    // every field — so the first problem may be on a screen that is not mounted,
    // and the refusal would point at nothing. Jump to the screen that owns it
    // first. Unreachable through normal use (`tryAdvance` gates step 1), but a
    // signed-in shopper whose session drops mid-checkout gets there: `phoneUsable`
    // tightens to the BD-mobile rule and a number that passed step 1 no longer
    // does. A no-op in the three single-screen layouts, which never read `step`.
    const offending = firstInvalidField(errors);
    if (offending) setStep(stepForField(offending, customSlots));

    // No toast here: `PlaceOrderButton` renders the same sentence as a banner
    // beside itself, and `reveal()` has already scrolled to the offending field,
    // which shows the SPECIFIC message. A toast would be the generic one, twice.
    if (!errorState.reveal()) return;

    // Pickup carries only contact fields; delivery carries the full canonical address.
    // Send the number in the form the server stores (see `canonicalizeBdPhone`),
    // so the confirmation the buyer reads back matches the one the merchant and
    // the courier are given.
    const phone = canonicalizeBdPhone(addr.phone) ?? addr.phone;
    const shippingAddress: ShippingAddress = isPickup
      ? { name: addr.name, phone, notes: addr.notes || undefined }
      : {
          name: addr.name,
          phone,
          address: addr.address,
          // Courier-neutral canonical location — the backend maps it to a
          // courier's codes at dispatch, never here.
          // Flat mode asks for neither; the server infers the district and
          // backfills it, so the courier cache and reporting stay whole.
          district: isFlatAddress ? undefined : geo.district,
          area: isFlatAddress ? undefined : geo.area,
          // The shopper's EXPLICIT answer, and only that. Sending the derived
          // `zone` here defeated the server's own guard: it treats a supplied
          // zone as the shopper having been asked, so an unanswered ambiguous
          // address arrived looking answered and was priced at the fallback
          // instead of being refused. Omitted unless a person actually chose.
          zone: isFlatAddress
            ? needsZoneChoice
              ? zoneChoice
              : undefined
            : zone,
          notes: addr.notes || undefined,
        };
    placeOrder.mutate(
      {
        items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
        fulfillmentType: isPickup ? "pickup" : "delivery",
        shippingAddress,
        paymentMethod: effectivePayment,
        couponCode: applied?.code,
        termsAccepted: termsRequired ? termsAccepted : undefined,
        // Only what the shopper was actually asked. State keeps an answer typed
        // before a payment-method switch so it survives switching back, but
        // sending it would file a bank reference against a COD order — and the
        // server drops it anyway, by the same rule.
        customFieldAnswers: Object.keys(visibleCustomFieldAnswers).length
          ? visibleCustomFieldAnswers
          : undefined,
        // Lets the server close this browser's mirrored cart. Without it a guest
        // order leaves the cart `active` — counted as abandoned, missing from the
        // conversion funnel, and eventually eligible for a "you left these behind"
        // reminder about a parcel that already arrived. `null` here is normal
        // (Safari private mode), and the order must not depend on it.
        // A landing page's form orders its own lines, so it has no cart to close.
        anonymousId: lines ? undefined : (cartAnonymousId(slug) ?? undefined),
        // Meta attribution, snapshotted HERE and replayed by the backend when the order reaches
        // the merchant's purchase trigger. It has to travel in the body: `_fbp`/`_fbc` are
        // first-party cookies on the storefront's host and the API is on another one, so a
        // cross-site request never carries them. Undefined is normal (blocked cookies, no ad
        // click) and an order must never depend on it — same rule as `anonymousId` above.
        meta: metaCheckoutAttribution(),
        // Which landing page and ad this visit came through, for the merchant's
        // orders-per-page count. Optional like `meta` — see `orderSource`.
        source: orderSource(),
      },
      {
        onSuccess: (order) => {
          rememberAddress();
          // Meta `Purchase`, from the browser, ONLY when the merchant switched it on
          // (`store.meta.events.purchase`, off by default). It carries the same deterministic
          // `event_id` as the server-side Conversions API event, which is how Meta collapses the
          // pair into one conversion — see `trackMetaPurchase`.
          //
          // Fired here rather than from an effect on `placed`: this runs exactly once per
          // successful placement, while an effect re-runs on every re-render and would need its
          // own guard. Before `clear()` would work equally well — it reads the order, not the
          // cart — but ahead of it is where the sale is unambiguously real.
          trackMetaPurchase(store, order);
          // The shopper's basket is not what a landing page's form ordered.
          if (!lines) clear();
          setPlaced(order);
          toast.success(t.orderPlaced);
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  return {
    // context
    t,
    lang,
    base,
    store,
    currency,
    items,
    /** These lines are the editor preview's sample, not a real basket. */
    sampleCart: preview?.sample ?? false,
    shopper,
    hydrated,
    placed,
    placing: placeOrder.isPending,
    // address + contact
    addr,
    set,
    captureContact,
    geo,
    setGeo,
    savedAddresses,
    selectedId,
    isNew,
    pickSaved,
    pickNew,
    saveNew,
    setSaveNew,
    // validation
    errors: errorState.visible,
    allErrors: errors,
    errorsRevealed: errorState.revealed,
    touch: errorState.touch,
    // fulfillment
    pickupOffered,
    fulfillment,
    setFulfillment,
    isPickup,
    // money
    zoned,
    zone,
    zoneLabel,
    isFlatAddress,
    inference,
    needsZoneChoice,
    zoneChoice,
    setZoneChoice,
    customFields,
    customFieldAnswers,
    setCustomFieldAnswer: (key: string, value: string) =>
      setCustomFieldAnswers((prev) => ({ ...prev, [key]: value })),
    subtotal,
    shipping,
    discount,
    total,
    minOrder,
    belowMin,
    // payment
    methods,
    effectivePayment,
    setPayment,
    // coupon
    coupon,
    setCoupon,
    applied,
    applying,
    applyCoupon,
    // terms
    termsRequired,
    termsAccepted,
    setTermsAccepted,
    termsSlug,
    returnsPage,
    // steps + submit
    step,
    setStep,
    tryAdvance,
    submit,
  };
}

export type CheckoutApi = ReturnType<typeof useCheckout>;
