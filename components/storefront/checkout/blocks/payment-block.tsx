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
  const { t, store, methods, effectivePayment, setPayment } = api;
  // Merchant-written next step for a manual transfer (Payments settings). Kept
  // out of the button below on purpose: it holds an account number the shopper
  // has to READ and copy, and text inside a toggle is hostile to select.
  const bankInstructions = store?.bankInstructions?.trim();
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
                {/* Only COD gets a built-in sub-line, and only because COD is
                    the one method whose meaning is a promise we can make
                    without the merchant: you pay on delivery. Bank transfer's
                    next step differs per store, so we never guess it — the
                    store states it itself, and it renders under the list. */}
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

      {/* Shown only while bank is the CHOSEN method — instructions for a
          payment the shopper is not making are noise. `pre-wrap` keeps the
          merchant's own line breaks: account name, number and branch are
          typed on separate lines and must stay that way to be readable. */}
      {effectivePayment === "bank" && bankInstructions ? (
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: 14,
            background: "var(--surface)",
          }}
        >
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
            {t.bankInstructionsHeading}
          </div>
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.55,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {bankInstructions}
          </div>
        </div>
      ) : null}
    </div>
  );
}
