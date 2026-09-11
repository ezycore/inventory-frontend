"use client";
// coding-standard: maintained

import Link from "next/link";
import { storeHref } from "@/lib/storefront-links";
import { money } from "@/components/storefront/format";
import { DANGER, Field } from "@/components/storefront/checkout/checkout-field";
import { CustomFields } from "@/components/storefront/checkout/blocks/custom-fields";
import { slotOf } from "@/components/storefront/checkout/checkout-validation";
import type { CheckoutApi } from "@/components/storefront/checkout/use-checkout";

/**
 * Minimum-order notice, the merchant's `before-submit` fields, and the terms
 * checkbox.
 *
 * Renders nothing when none of the three applies, so a layout can place it
 * unconditionally without leaving a gap — which is what stops the four layouts
 * drifting on where it goes.
 *
 * It carries the `before-submit` anchor because it is the one block all four
 * layouts put immediately above the place-order button. In `single` that is
 * inside the sticky summary rail, which is narrower than the form — the price of
 * the anchor meaning the same thing everywhere, and the merchant chose the last
 * word before the button knowing it sits beside the total.
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
  // The merchant's own last word counts as a reason to render, or a store with
  // no minimum and no terms would silently drop every `before-submit` field.
  const hasPreSubmit = api.customFields.some(
    (field) => slotOf(field) === "before-submit",
  );
  if (!belowMin && !termsRequired && !hasPreSubmit) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
      {/* Above the minimum-order line and the checkbox: those two are OUR
          refusals, and the merchant's notice should not be read as part of
          them. */}
      <CustomFields api={api} slot="before-submit" />
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
