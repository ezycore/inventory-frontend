"use client";
// coding-standard: maintained

import { Icon, type IconName } from "@/components/storefront/sf-icons";
import { label } from "@/components/storefront/checkout/checkout-bits";
import type { CheckoutApi } from "@/components/storefront/checkout/use-checkout";

const PAY_ICON: Record<string, IconName> = { cod: "coins", bank: "bank" };

/** The payment-method picker. Never invalid — one method is always selected. */
export function PaymentBlock({
  api,
  showHeading = true,
}: {
  api: CheckoutApi;
  showHeading?: boolean;
}) {
  const { t, methods, effectivePayment, setPayment } = api;
  return (
    <div>
      {showHeading ? <div style={label}>{t.paymentMethod}</div> : null}
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
                <Icon name={PAY_ICON[m]} size={20} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 14, fontWeight: 600 }}>
                  {m === "cod" ? t.cod : t.bankTransfer}
                </span>
                {/* Only COD gets a sub-line, and only because COD is the one
                    method whose meaning is a promise we can make without the
                    merchant: you pay on delivery. Bank transfer's next step
                    differs per store, so saying nothing beats guessing. */}
                {m === "cod" ? (
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--muted)", marginTop: 1 }}>
                    {t.codHint}
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
    </div>
  );
}
