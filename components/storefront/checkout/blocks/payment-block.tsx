"use client";
// coding-standard: maintained

import { Icon, type IconName } from "@/components/storefront/sf-icons";
import { label } from "@/components/storefront/checkout/checkout-bits";
import { CustomFields } from "@/components/storefront/checkout/blocks/custom-fields";
import type { CheckoutApi } from "@/components/storefront/checkout/use-checkout";
import {
  storefrontPaymentIcon,
  storefrontPaymentMethodLabel,
  storefrontPaymentMethodSubtitle,
} from "@/lib/storefront-payment-methods";

/** The payment-method picker. Never invalid — one method is always selected. */
export function PaymentBlock({
  api,
  showHeading = true,
}: {
  api: CheckoutApi;
  showHeading?: boolean;
}) {
  const { t, store, methods, effectivePayment, setPayment } = api;
  return (
    <div>
      {showHeading ? <div style={label}>{t.paymentMethod}</div> : null}
      {/* Above the method list, under the heading: a notice about HOW to pay has
          to be read before the choice, not after it. */}
      <CustomFields api={api} slot="before-payment" style={{ marginBottom: 14 }} />
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
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                border: `1px solid ${sel ? "var(--primary)" : "var(--border-strong)"}`,
                background: sel ? "var(--primary-soft)" : "var(--card)",
                textAlign: "left",
              }}
            >
              <span style={{ color: "var(--primary)", display: "flex" }}>
                <Icon
                  name={storefrontPaymentIcon(m, store?.paymentMethods) as IconName}
                  size={20}
                />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 14, fontWeight: 600 }}>
                  {storefrontPaymentMethodLabel(m, t, store?.paymentMethods)}
                </span>
                {/* The sub-line is the merchant's own words only — the platform
                    adds none, not even for COD. */}
                {storefrontPaymentMethodSubtitle(m, store?.paymentMethods) ? (
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--muted)", marginTop: 1 }}>
                    {storefrontPaymentMethodSubtitle(m, store?.paymentMethods)}
                  </span>
                ) : null}
              </span>
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

      {/* Payment instructions used to be a hardcoded `bankInstructions`
          panel right here, readable only by the one method that had a
          column for it. They are a method-scoped notice now: the same place
          on screen, but every method can carry its own, and the merchant
          writes them all in one editor instead of one box per method. See
          `CheckoutField.showWhen`. */}
      <CustomFields api={api} slot="after-payment" style={{ marginTop: 14 }} />
    </div>
  );
}
