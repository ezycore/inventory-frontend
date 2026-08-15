"use client";
// coding-standard: maintained

import { useState } from "react";
import { toast } from "@/lib/storefront-toast";
import {
  usePlaceOrder,
  useShopperAccount,
  useStore,
  useStorePages,
} from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useCartStore } from "@/services/stores/use-cart-store";
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
} from "@/lib/storefront-shipping";
import { money } from "@/components/storefront/format";
import { useHydrated } from "@/hooks/use-hydrated";
import { useGuestContactCapture } from "@/hooks/use-guest-contact-capture";
import { cartAnonymousId } from "@/services/storefront/cart-identity";
import { isValidBdPhone } from "@/services/storefront/bd-phone";
import type { GeoValue } from "@/components/storefront/checkout/geo-picker";

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
 */
export function useCheckout() {
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

  const items = storeSlug === slug ? allItems : [];
  const currency = store?.currency;
  const methods = store?.allowedPaymentMethods ?? ["cod"];
  const savedAddresses = shopper?.addresses ?? [];

  const [addr, setAddr] = useState({ name: "", phone: "", address: "", notes: "" });
  const set = (k: keyof typeof addr, v: string) => setAddr((a) => ({ ...a, [k]: v }));
  // Merchant visibility only (abandoned carts), guests only, fire-and-forget —
  // a shopper who fills this form and leaves is otherwise unreachable.
  const captureContact = useGuestContactCapture(slug, !shopper);
  // Which saved address is selected (null + isNew → the shopper is entering a new one).
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saveNew, setSaveNew] = useState(true);
  const [geo, setGeo] = useState<GeoValue>(emptyGeo);

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

  const [payment, setPayment] = useState<"cod" | "bank">(methods[0]);
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

  // Zone is derived from the picked district — no separate toggle (see zoneForDistrict).
  const zone = zoneForDistrict(geo.district);
  const zoned = hasZoneShipping(store);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  // Pickup has no courier, so no shipping charge.
  const shipping = isPickup ? 0 : computeShipping(store, subtotal, zone);
  const discount = applied?.discountAmount ?? 0;
  const total = Math.max(0, subtotal - discount) + shipping;
  const zoneLabel = zone === "inside" ? t.insideDhaka : t.outsideDhaka;

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
  const needAddress = required.has("address");
  const needArea = required.has("area") || zoned;
  // A GUEST's phone is their identity, not just a contact detail — the server
  // rejects one it cannot normalise with `INVALID_PHONE`, so validate the same
  // rule here rather than letting them discover it at submit. A signed-in shopper
  // keeps the looser check: they are already identified by their account, and
  // tightening that is a separate change.
  const phoneUsable = shopper ? !!addr.phone.trim() : isValidBdPhone(addr.phone);
  const phoneInvalid = !shopper && !!addr.phone.trim() && !phoneUsable;
  const contactComplete = !!(
    (!required.has("name") || addr.name.trim()) &&
    (!required.has("phone") || phoneUsable)
  );
  // Delivery honours the configured fields; pickup only needs name + phone.
  const deliveryComplete = !!(
    (!needAddress || addr.address.trim()) &&
    (!needArea || (geo.district.trim() && geo.area.trim()))
  );
  const addressComplete = isPickup
    ? contactComplete
    : contactComplete && deliveryComplete;

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

  const canSubmit =
    addressComplete && !belowMin && (!termsRequired || termsAccepted);
  // Per-step advance gate for any layout that has steps: step 1 = address/contact,
  // step 2 = payment. Terms/min-order are settled at the final submit, not here.
  //
  // `addressComplete` already carries the phone rule, which is what makes a
  // stepped path safe: without it a guest advances past step 1 with a junk
  // number and only meets the 400 two screens later.
  const stepBlocked = step === 1 && !addressComplete;

  // Best-effort: remember the picked district/area on the chosen address (or save
  // a brand-new one), so the next checkout is pre-filled. Never blocks the order.
  const rememberAddress = () => {
    if (!token || isPickup) return; // pickup has no delivery address to remember
    const { district, area } = geo;
    if (!isNew && selectedId) {
      account.updateAddress.mutate({ addressId: selectedId, district, area });
    } else if (isNew && saveNew && addr.address.trim()) {
      account.addAddress.mutate({
        label: addr.address.trim().slice(0, 38) || t.newAddress,
        line: addr.address.trim(),
        phone: addr.phone.trim() || undefined,
        district,
        area,
      });
    }
  };

  const submit = () => {
    // Pickup carries only contact fields; delivery carries the full canonical address.
    const shippingAddress: ShippingAddress = isPickup
      ? { name: addr.name, phone: addr.phone, notes: addr.notes || undefined }
      : {
          name: addr.name,
          phone: addr.phone,
          address: addr.address,
          // Courier-neutral canonical location — the backend maps it to a
          // courier's codes at dispatch, never here.
          district: geo.district,
          area: geo.area,
          zone,
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
        // Lets the server close this browser's mirrored cart. Without it a guest
        // order leaves the cart `active` — counted as abandoned, missing from the
        // conversion funnel, and eventually eligible for a "you left these behind"
        // reminder about a parcel that already arrived. `null` here is normal
        // (Safari private mode), and the order must not depend on it.
        anonymousId: cartAnonymousId(slug) ?? undefined,
      },
      {
        onSuccess: (order) => {
          rememberAddress();
          clear();
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
    phoneInvalid,
    // fulfillment
    pickupOffered,
    fulfillment,
    setFulfillment,
    isPickup,
    // money
    zoned,
    zoneLabel,
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
    // steps + submit
    step,
    setStep,
    stepBlocked,
    canSubmit,
    submit,
  };
}

export type CheckoutApi = ReturnType<typeof useCheckout>;
