"use client";
// coding-standard: maintained

import { input, label as groupLabel } from "@/components/storefront/checkout/checkout-bits";
import { invalidInput } from "@/components/storefront/checkout/checkout-field";
import { FieldPair, LabeledField } from "@/components/storefront/checkout/blocks/labeled-field";
import { GuestNotice } from "@/components/storefront/checkout/guest-notice";
import type { CheckoutApi } from "@/components/storefront/checkout/use-checkout";

/**
 * Who the order is for — name and phone, and nothing else.
 *
 * Split from the delivery fields because they answer a different question, and
 * because a pickup order needs only these. They share a row: two short answers
 * stacked make the form look twice as long as it is, and length is what a
 * checkout gets abandoned for.
 */
export function ContactFields({
  api,
  showHeading = true,
}: {
  api: CheckoutApi;
  showHeading?: boolean;
}) {
  const { t, base, shopper, addr, set, captureContact, errors, touch } = api;

  return (
    <div>
      {/* An OFFER, not a step. Signing in prefills saved addresses and files the
          order under the account; skipping it costs nothing — the notice just
          says what "skipping it" means. */}
      {!shopper ? <GuestNotice base={base} t={t} /> : null}

      {showHeading ? <div style={groupLabel}>{t.contactHeading}</div> : null}

      <FieldPair>
        <LabeledField name="name" label={t.fullName} error={errors.name}>
          {(id) => (
            <input
              id={id}
              style={errors.name ? invalidInput() : input}
              aria-invalid={!!errors.name}
              value={addr.name}
              onChange={(e) => set("name", e.target.value)}
              onBlur={(e) => {
                touch("name");
                captureContact("name", e.target.value);
              }}
            />
          )}
        </LabeledField>

        <LabeledField name="phone" label={t.mobileLabel} error={errors.phone}>
          {(id) => (
            <input
              id={id}
              style={errors.phone ? invalidInput() : input}
              aria-invalid={!!errors.phone}
              placeholder={t.phonePh}
              value={addr.phone}
              inputMode="tel"
              onChange={(e) => set("phone", e.target.value)}
              onBlur={(e) => {
                touch("phone");
                captureContact("phone", e.target.value);
              }}
            />
          )}
        </LabeledField>
      </FieldPair>
    </div>
  );
}
