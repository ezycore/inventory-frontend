"use client";
// coding-standard: maintained

import Link from "next/link";
import { storeHref } from "@/lib/storefront-links";
import { money } from "@/components/storefront/format";
import { DANGER, Field } from "@/components/storefront/checkout/checkout-field";
import type { CheckoutApi } from "@/components/storefront/checkout/use-checkout";

/**
 * Minimum-order notice + the terms checkbox.
 *
 * Renders nothing when neither applies, so a layout can place it unconditionally
 * without leaving a gap — which is what stops the four layouts drifting on where
 * it goes.
 */
export function TermsBlock({ api }: { api: CheckoutApi }) {
  const {
    t,
    base,
    currency,
    minOrder,
    belowMin,
    termsRequired,
    termsAccepted,
    setTermsAccepted,
    termsSlug,
    errors,
  } = api;
  if (!belowMin && !termsRequired) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
      {belowMin ? (
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: "var(--text)",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "9px 12px",
          }}
        >
          {t.minOrderNotice} {money(minOrder, currency)}
        </div>
      ) : null}
      {termsRequired ? (
        <Field name="terms" error={errors.terms}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: errors.terms ? DANGER : "var(--muted)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            {/* {terms} splits the sentence so only the terms phrase links. Clicking
                an <a> inside a <label> navigates without toggling the checkbox
                (HTML: interactive descendants don't activate it). */}
            <span>
              {t.agreeToTerms.split("{terms}").map((part, i) => (
                <span key={i}>
                  {i > 0 &&
                    (termsSlug ? (
                      <Link
                        href={storeHref(base, `/pages/${termsSlug}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--text)", fontWeight: 600, textDecoration: "underline" }}
                      >
                        {t.termsLinkLabel}
                      </Link>
                    ) : (
                      t.termsLinkLabel
                    ))}
                  {part}
                </span>
              ))}
            </span>
          </label>
        </Field>
      ) : null}
    </div>
  );
}
