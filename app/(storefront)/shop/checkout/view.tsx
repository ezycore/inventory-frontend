"use client";
// coding-standard: maintained

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/storefront-toast";
import {
  usePlaceOrder,
  useShopperAccount,
  useStore,
} from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { cartLineKey, useCartStore } from "@/services/stores/use-cart-store";
import { useShopperStore } from "@/services/stores/use-shopper-store";
import { storefrontApi } from "@/lib/storefront-client";
import type {
  ShopperAddress,
  ShippingAddress,
  StorefrontOrder,
} from "@/lib/storefront-client";
import { resolveTemplates } from "@/lib/storefront-templates";
import {
  computeShipping,
  hasZoneShipping,
  zoneForDistrict,
} from "@/lib/storefront-shipping";
import { storeHref } from "@/lib/storefront-links";
import { money } from "@/components/storefront/format";
import { Icon, type IconName } from "@/components/storefront/sf-icons";
import { VerifyEmailGate } from "@/components/storefront/verify-email-gate";
import { LoadingSplash } from "@/components/storefront/loading-splash";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  StepsBar,
  SummaryRow,
  ghostBtn,
  input,
  label,
  primaryBtn,
  primaryLink,
} from "@/components/storefront/checkout/checkout-bits";
import { OrderPlacedCard } from "@/components/storefront/checkout/order-placed-card";
import { CheckoutAddressBook } from "@/components/storefront/checkout/checkout-address-book";
import {
  GeoPicker,
  type GeoValue,
} from "@/components/storefront/checkout/geo-picker";

const wrap: CSSProperties = {
  maxWidth: 940,
  margin: "0 auto",
  width: "100%",
  padding: "22px var(--pad) 40px",
};
const PAY_ICON: Record<string, IconName> = { cod: "coins", bank: "bank" };

const emptyGeo = (): GeoValue => ({ district: "", area: "" });

export default function CheckoutPage() {
  const { slug, base } = useStoreContext();
  const { t, lang } = useStorefrontUI();
  const { data: store } = useStore(slug);
  const placeOrder = usePlaceOrder(slug);
  const account = useShopperAccount(slug);
  const router = useRouter();

  const shopper = useShopperStore((s) => s.shopper);
  const token = useShopperStore((s) => s.token);
  const hydrated = useHydrated();

  // Guests go straight to sign-in (no intermediate "Account" step) and bounce
  // back here after — the account page honours `?next=`. Wait for the persisted
  // store to hydrate, or a signed-in shopper refreshing this page gets bounced.
  useEffect(() => {
    if (hydrated && !shopper) {
      router.replace(storeHref(base, "/account?next=/checkout"));
    }
  }, [hydrated, shopper, router, base]);
  const storeSlug = useCartStore((s) => s.storeSlug);
  const allItems = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);

  const items = storeSlug === slug ? allItems : [];
  const currency = store?.currency;
  const variant = resolveTemplates(store).checkout;
  const multi = variant === "multi";
  const methods = store?.allowedPaymentMethods ?? ["cod"];

  const savedAddresses = shopper?.addresses ?? [];

  const [addr, setAddr] = useState({ name: "", phone: "", address: "", notes: "" });
  const set = (k: keyof typeof addr, v: string) => setAddr((a) => ({ ...a, [k]: v }));
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
    if (!coupon.trim() || !token) return;
    setApplying(true);
    try {
      const res = await storefrontApi.validateCoupon(slug, token, {
        code: coupon.trim(),
        items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
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

  const contactComplete = !!(addr.name.trim() && addr.phone.trim());
  // Delivery needs the full canonical address; pickup only needs name + phone.
  const deliveryComplete = !!(
    addr.address.trim() &&
    geo.district.trim() &&
    geo.area.trim()
  );
  const canSubmit = isPickup ? contactComplete : contactComplete && deliveryComplete;
  // Per-step advance gate (multi-step template): step 1 = address/contact,
  // step 2 = payment.
  const stepBlocked = step === 1 && !canSubmit;

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

  // ----- gates -----
  if (!shopper) {
    // Either the persisted session hasn't hydrated yet or the effect above is
    // redirecting a guest to sign-in — both get a neutral splash.
    return (
      <div style={wrap}>
        <LoadingSplash />
      </div>
    );
  }

  // Orders need a confirmed email (backend enforces the same rule).
  if (!shopper.emailVerified && !placed) {
    return (
      <div style={wrap}>
        <VerifyEmailGate />
      </div>
    );
  }

  if (placed) {
    return (
      <div style={wrap}>
        <OrderPlacedCard order={placed} base={base} t={t} />
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

  const showAddress = !multi || step === 1;
  const showPayment = !multi || step === 2;
  const showReview = multi && step === 3;

  const steps = [
    { n: 1, label: t.stepAddress },
    { n: 2, label: t.stepPayment },
    { n: 3, label: t.stepReview },
  ];

  return (
    <div style={wrap}>
      {multi ? <StepsBar steps={steps} step={step} /> : null}

      <div style={{ display: "grid", gridTemplateColumns: "var(--cartgrid)", gap: "var(--gap)", alignItems: "start" }}>
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 22 }}>
          {showAddress ? (
            <div>
              {/* Delivery vs in-store pickup (only when the store offers pickup). */}
              {pickupOffered ? (
                <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
                  {(["delivery", "pickup"] as const).map((f) => {
                    const active = fulfillment === f;
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFulfillment(f)}
                        style={{
                          flex: 1,
                          border: `1px solid ${active ? "var(--primary)" : "var(--border-strong)"}`,
                          background: active ? "var(--primary-soft)" : "var(--surface)",
                          color: active ? "var(--primary)" : "var(--text)",
                          borderRadius: 10,
                          padding: "12px 14px",
                          fontFamily: "inherit",
                          fontSize: 14,
                          fontWeight: active ? 700 : 500,
                          cursor: "pointer",
                        }}
                      >
                        {f === "delivery" ? t.fulfillmentDelivery : t.fulfillmentPickup}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {!isPickup && savedAddresses.length > 0 ? (
                <>
                  <div style={label}>{t.savedAddresses}</div>
                  <CheckoutAddressBook
                    addresses={savedAddresses}
                    selectedId={selectedId}
                    isNew={isNew}
                    onPick={pickSaved}
                    onNew={pickNew}
                    labels={{ newAddress: t.newAddress, default: t.default }}
                  />
                </>
              ) : null}
              <div style={label}>{isPickup ? t.pickupHeading : t.deliveryAddress}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 20 }}>
                <input style={input} placeholder={t.fullName} value={addr.name} onChange={(e) => set("name", e.target.value)} />
                <input style={input} placeholder={t.phone} value={addr.phone} onChange={(e) => set("phone", e.target.value)} />
                {!isPickup ? (
                  <>
                    <input style={input} placeholder={t.addressLine} value={addr.address} onChange={(e) => set("address", e.target.value)} />
                    <GeoPicker
                      value={geo}
                      onChange={setGeo}
                      lang={lang}
                      labels={{ district: t.selectDistrict, area: t.selectArea, noMatch: t.comboNoMatch }}
                    />
                  </>
                ) : null}
                <input style={input} placeholder={t.orderNotesPh} value={addr.notes} onChange={(e) => set("notes", e.target.value)} />

                {/* Pickup: show the collection location + any instructions (read-only). */}
                {isPickup && store?.pickup?.location ? (
                  <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 14, background: "var(--muted-surface, var(--surface))" }}>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 3 }}>{t.pickupFrom}</div>
                    <div style={{ fontSize: 14.5, fontWeight: 700 }}>{store.pickup.location.name}</div>
                    {store.pickup.location.address ? (
                      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{store.pickup.location.address}</div>
                    ) : null}
                    {store.pickup.instructions ? (
                      <div style={{ fontSize: 12.5, color: "var(--faint)", marginTop: 8, lineHeight: 1.5 }}>{store.pickup.instructions}</div>
                    ) : null}
                  </div>
                ) : null}

                {/* Zone fee is derived from the district — shown read-only, not asked. */}
                {!isPickup && zoned && geo.district ? (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--muted)", padding: "2px 2px" }}>
                    <span>{t.deliveryZone} · {zoneLabel}</span>
                    <span className="sf-mono" style={{ color: "var(--text)", fontWeight: 600 }}>
                      {shipping === 0 ? t.free : money(shipping, currency)}
                    </span>
                  </div>
                ) : null}
                {!isPickup && isNew && savedAddresses.length > 0 ? (
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted)", cursor: "pointer" }}>
                    <input type="checkbox" checked={saveNew} onChange={(e) => setSaveNew(e.target.checked)} />
                    {t.saveThisAddress}
                  </label>
                ) : null}
              </div>
            </div>
          ) : null}

          {showPayment ? (
            <div>
              <div style={label}>{t.paymentMethod}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 8 }}>
                {methods.map((m) => {
                  const sel = effectivePayment === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayment(m)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: 14,
                        borderRadius: 10,
                        cursor: "pointer",
                        border: `1px solid ${sel ? "var(--primary)" : "var(--border-strong)"}`,
                        background: sel ? "var(--primary-soft)" : "var(--card)",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ color: "var(--primary)", display: "flex" }}>
                        <Icon name={PAY_ICON[m]} size={20} />
                      </span>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{m === "cod" ? t.cod : t.bankTransfer}</span>
                      {m === "cod" ? (
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--primary)", background: "var(--primary-soft)", padding: "3px 8px", borderRadius: 999 }}>
                          {t.default}
                        </span>
                      ) : null}
                      {sel ? (
                        <span style={{ color: "var(--primary)", display: "flex" }}>
                          <Icon name="dot" size={16} />
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {showReview ? (
            <div>
              <div style={label}>{t.reviewOrder}</div>
              {items.map((i) => (
                <div key={cartLineKey(i)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--border)", fontSize: 13.5 }}>
                  <span>
                    {i.name}
                    {i.variantLabel ? <span style={{ color: "var(--muted)" }}> · {i.variantLabel}</span> : null}{" "}
                    <span className="sf-mono" style={{ color: "var(--faint)" }}>×{i.quantity}</span>
                  </span>
                  <span className="sf-mono" style={{ fontWeight: 600 }}>{money(i.price * i.quantity, currency)}</span>
                </div>
              ))}
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 12 }}>
                {t.shipTo}: <span style={{ color: "var(--text)" }}>{(isPickup ? `${t.fulfillmentPickup}${store?.pickup?.location ? ` · ${store.pickup.location.name}` : ""}` : [geo.area, geo.district].filter(Boolean).join(", "))} · {effectivePayment === "cod" ? t.cod : t.bankTransfer}</span>
              </div>
            </div>
          ) : null}

          {multi ? (
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              {step > 1 ? (
                <button type="button" onClick={() => setStep((s) => s - 1)} style={ghostBtn}>
                  {t.backStep}
                </button>
              ) : null}
              {step < 3 ? (
                <button type="button" onClick={() => setStep((s) => Math.min(3, s + 1))} disabled={stepBlocked} style={{ ...primaryBtn, flex: 1, opacity: stepBlocked ? 0.5 : 1 }}>
                  {t.continueStep}
                </button>
              ) : (
                <button type="button" onClick={submit} disabled={!canSubmit || placeOrder.isPending} style={{ ...primaryBtn, flex: 1, opacity: !canSubmit || placeOrder.isPending ? 0.6 : 1 }}>
                  {placeOrder.isPending ? "…" : t.placeOrder}
                </button>
              )}
            </div>
          ) : (
            <button type="button" onClick={submit} disabled={!canSubmit || placeOrder.isPending} style={{ ...primaryBtn, width: "100%", marginTop: 6, opacity: !canSubmit || placeOrder.isPending ? 0.6 : 1 }}>
              {placeOrder.isPending ? "…" : `${t.placeOrder} · ${money(total, currency)}`}
            </button>
          )}
        </div>

        {/* Summary */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>{t.orderSummary}</h3>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input style={{ ...input, padding: "10px 12px" }} placeholder={t.coupon} value={coupon} onChange={(e) => setCoupon(e.target.value)} />
            <button type="button" onClick={applyCoupon} disabled={applying || !coupon.trim()} style={{ ...ghostBtn, padding: "0 14px", whiteSpace: "nowrap" }}>
              {t.applyFilters}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            <SummaryRow label={t.subtotal} value={money(subtotal, currency)} />
            {discount > 0 ? (
              <SummaryRow label={`${t.discount}${applied ? ` (${applied.code})` : ""}`} value={`− ${money(discount, currency)}`} accent />
            ) : null}
            <SummaryRow
              label={isPickup ? t.fulfillmentPickup : zoned ? `${t.shipping} · ${zoneLabel}` : t.shipping}
              value={isPickup ? t.pickupFree : shipping === 0 ? t.free : money(shipping, currency)}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, fontWeight: 700, borderTop: "1px solid var(--border)", paddingTop: 14, letterSpacing: "-0.02em" }}>
            <span>{t.total}</span>
            <span className="sf-mono">{money(total, currency)}</span>
          </div>
          <p style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 10, marginBottom: 0 }}>
            {lang === "bn" ? "অর্ডার করার সময় দাম ও স্টক যাচাই করা হবে।" : "Stock & prices are re-checked when you place the order."}
          </p>
        </div>
      </div>
    </div>
  );
}
