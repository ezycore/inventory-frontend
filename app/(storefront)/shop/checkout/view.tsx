"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { usePlaceOrder, useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useCartStore } from "@/services/stores/use-cart-store";
import { useShopperStore } from "@/services/stores/use-shopper-store";
import { storefrontApi } from "@/lib/storefront-client";
import type { StorefrontOrder } from "@/lib/storefront-client";
import { resolveTemplates } from "@/lib/storefront-templates";
import { computeShipping, type Zone } from "@/lib/storefront-shipping";
import { storeHref } from "@/lib/storefront-links";
import { money, taka } from "@/components/storefront/format";
import { Icon, type IconName } from "@/components/storefront/sf-icons";

const wrap: CSSProperties = {
  maxWidth: 940,
  margin: "0 auto",
  width: "100%",
  padding: "22px var(--pad) 40px",
};
const label: CSSProperties = {
  fontSize: 11.5,
  fontWeight: 700,
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: 12,
};
const input: CSSProperties = {
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--text)",
  borderRadius: 8,
  padding: "12px 14px",
  fontFamily: "inherit",
  fontSize: 14,
  outline: "none",
  width: "100%",
};
const PAY_ICON: Record<string, IconName> = { cod: "coins", bank: "bank" };

export default function CheckoutPage() {
  const { slug, base } = useStoreContext();
  const { t, lang } = useStorefrontUI();
  const { data: store } = useStore(slug);
  const placeOrder = usePlaceOrder(slug);

  const shopper = useShopperStore((s) => s.shopper);
  const token = useShopperStore((s) => s.token);
  const storeSlug = useCartStore((s) => s.storeSlug);
  const allItems = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);

  const items = storeSlug === slug ? allItems : [];
  const currency = store?.currency;
  const variant = resolveTemplates(store).checkout;
  const multi = variant === "multi";
  const methods = store?.allowedPaymentMethods ?? ["cod"];

  const [addr, setAddr] = useState({ name: shopper?.name ?? "", phone: shopper?.phone ?? "", address: "", notes: "" });
  const set = (k: keyof typeof addr, v: string) => setAddr((a) => ({ ...a, [k]: v }));
  const [zone, setZone] = useState<Zone>("inside");
  const [payment, setPayment] = useState<"cod" | "bank">(methods[0]);
  const effectivePayment = methods.includes(payment) ? payment : methods[0];
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<{ code: string; discountAmount: number } | null>(null);
  const [applying, setApplying] = useState(false);
  const [step, setStep] = useState(1);
  const [placed, setPlaced] = useState<StorefrontOrder | null>(null);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = computeShipping(store, subtotal, zone);
  const discount = applied?.discountAmount ?? 0;
  const total = Math.max(0, subtotal - discount) + shipping;
  const zoneLabel = zone === "inside" ? t.insideDhaka : t.outsideDhaka;
  const zones = store?.shippingZones;
  const insideNote =
    zones?.inside != null ? `${taka(zones.inside)} · 1–2 days` : "1–2 days";
  const outsideNote =
    zones?.outside != null ? `${taka(zones.outside)} · 3–5 days` : "3–5 days";

  const applyCoupon = async () => {
    if (!coupon.trim() || !token) return;
    setApplying(true);
    try {
      const res = await storefrontApi.validateCoupon(slug, token, {
        code: coupon.trim(),
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
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

  const canSubmit = addr.name.trim() && addr.phone.trim() && addr.address.trim();

  const submit = () => {
    placeOrder.mutate(
      {
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: {
          name: addr.name,
          phone: addr.phone,
          address: addr.address,
          area: zone === "inside" ? "Inside Dhaka" : "Outside Dhaka",
          zone,
          notes: addr.notes || undefined,
        },
        paymentMethod: effectivePayment,
        couponCode: applied?.code,
      },
      {
        onSuccess: (order) => {
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
    return (
      <div style={wrap}>
        <div style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ fontSize: "var(--h2)", fontWeight: 700, marginBottom: 12 }}>{t.checkout}</h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 16 }}>{t.account}</p>
          <Link href={storeHref(base, "/account")} style={primaryLink}>
            {t.account}
          </Link>
        </div>
      </div>
    );
  }

  if (placed) {
    return (
      <div style={wrap}>
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: "48px 30px", textAlign: "center" }}>
          <div style={{ width: 66, height: 66, borderRadius: "50%", background: "var(--primary-soft)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px", animation: "ezPop 0.4s" }}>
            <Icon name="check" size={30} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.02em" }}>{t.orderPlaced}</h2>
          <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 6px" }}>{t.orderThanks}</p>
          <p className="sf-mono" style={{ fontSize: 14, margin: "0 0 24px" }}>
            {t.orderNo} {placed.orderNumber}
          </p>
          <div style={{ display: "flex", gap: 11, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={storeHref(base, `/account/orders/${placed.orderNumber}`)} style={primaryLink}>
              {t.trackThis}
            </Link>
            <Link href={storeHref(base, "/products")} style={ghostLink}>
              {t.continueShopping}
            </Link>
          </div>
        </div>
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
  const showDelivery = !multi || step === 2;
  const showPayment = !multi || step === 3;
  const showReview = multi && step === 4;

  const steps = [
    { n: 1, label: t.stepAddress },
    { n: 2, label: t.stepDelivery },
    { n: 3, label: t.stepPayment },
    { n: 4, label: t.stepReview },
  ];

  return (
    <div style={wrap}>
      {multi ? (
        <div style={{ display: "flex", alignItems: "center", marginBottom: 26 }}>
          {steps.map((st, idx) => (
            <div key={st.n} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span
                  className="sf-mono"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: st.n === step ? "var(--primary)" : "var(--surface)",
                    color: st.n === step ? "var(--on-primary)" : "var(--muted)",
                    border: st.n === step ? "none" : "1px solid var(--border-strong)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                    flex: "none",
                  }}
                >
                  {st.n}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{st.label}</span>
              </div>
              {idx < steps.length - 1 ? (
                <span style={{ flex: 1, height: 1, background: "var(--border-strong)", margin: "0 12px" }} />
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "var(--cartgrid)", gap: "var(--gap)", alignItems: "start" }}>
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 22 }}>
          {showAddress ? (
            <div>
              <div style={label}>{t.contactInfo}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 20 }}>
                <input style={input} placeholder={t.fullName} value={addr.name} onChange={(e) => set("name", e.target.value)} />
                <input style={input} placeholder={t.phone} value={addr.phone} onChange={(e) => set("phone", e.target.value)} />
                <input style={input} placeholder={t.address} value={addr.address} onChange={(e) => set("address", e.target.value)} />
                <input style={input} placeholder={`${t.orderSummary}…`} value={addr.notes} onChange={(e) => set("notes", e.target.value)} />
              </div>
            </div>
          ) : null}

          {showDelivery ? (
            <div>
              <div style={label}>{t.deliveryZone}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                <ZoneTile active={zone === "inside"} onClick={() => setZone("inside")} title={t.insideDhaka} note={insideNote} />
                <ZoneTile active={zone === "outside"} onClick={() => setZone("outside")} title={t.outsideDhaka} note={outsideNote} />
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
                <div key={i.productId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--border)", fontSize: 13.5 }}>
                  <span>
                    {i.name} <span className="sf-mono" style={{ color: "var(--faint)" }}>×{i.quantity}</span>
                  </span>
                  <span className="sf-mono" style={{ fontWeight: 600 }}>{money(i.price * i.quantity, currency)}</span>
                </div>
              ))}
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 12 }}>
                {t.shipTo}: <span style={{ color: "var(--text)" }}>{zoneLabel} · {effectivePayment === "cod" ? t.cod : t.bankTransfer}</span>
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
              {step < 4 ? (
                <button type="button" onClick={() => setStep((s) => Math.min(4, s + 1))} disabled={step === 1 && !canSubmit} style={{ ...primaryBtn, flex: 1, opacity: step === 1 && !canSubmit ? 0.5 : 1 }}>
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
            <SummaryRow label={`${t.shipping} · ${zoneLabel}`} value={shipping === 0 ? t.free : money(shipping, currency)} />
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

function ZoneTile({ active, onClick, title, note }: { active: boolean; onClick: () => void; title: string; note: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: `1px solid ${active ? "var(--primary)" : "var(--border-strong)"}`,
        background: active ? "var(--primary-soft)" : "var(--card)",
        borderRadius: 10,
        padding: 14,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
      <div className="sf-mono" style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>{note}</div>
    </button>
  );
}

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: accent ? "var(--primary)" : "var(--muted)" }}>
      <span>{label}</span>
      <span className="sf-mono">{value}</span>
    </div>
  );
}

const primaryBtn: CSSProperties = {
  background: "var(--primary)",
  color: "var(--on-primary)",
  border: "none",
  padding: 14,
  borderRadius: 9,
  fontFamily: "inherit",
  fontSize: 14.5,
  fontWeight: 700,
  cursor: "pointer",
};
const ghostBtn: CSSProperties = {
  background: "transparent",
  color: "var(--text)",
  border: "1px solid var(--border-strong)",
  padding: "12px 22px",
  borderRadius: 8,
  fontFamily: "inherit",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};
const primaryLink: CSSProperties = {
  display: "inline-block",
  background: "var(--primary)",
  color: "var(--on-primary)",
  padding: "12px 24px",
  borderRadius: 9,
  fontSize: 14,
  fontWeight: 600,
};
const ghostLink: CSSProperties = {
  display: "inline-block",
  background: "transparent",
  color: "var(--text)",
  border: "1px solid var(--border-strong)",
  padding: "12px 24px",
  borderRadius: 9,
  fontSize: 14,
  fontWeight: 600,
};
