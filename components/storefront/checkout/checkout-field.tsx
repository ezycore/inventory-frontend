"use client";
// coding-standard: maintained

import type { CSSProperties, ReactNode } from "react";
import { Icon } from "@/components/storefront/sf-icons";
import { input } from "@/components/storefront/checkout/checkout-bits";
import type { CheckoutField as FieldName } from "@/components/storefront/checkout/checkout-validation";

/**
 * How a checkout field reports that it is wrong.
 *
 * One component rather than an error `<div>` copy-pasted under six inputs — the
 * old checkout had exactly one of those (under the phone) and every other field
 * failed silently, which is the bug this fixes. Routing them all through here is
 * what keeps a *seventh* field from shipping without a message.
 *
 * `--danger` is not a storefront token and deliberately is not becoming one:
 * error red must stay legible on every merchant's brand, so it is fixed rather
 * than themable. It is the same `#dc2626` the phone error already used.
 */

export const DANGER = "#dc2626";
const DANGER_SOFT = "rgba(220, 38, 38, 0.08)";

const errorText: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  fontSize: 12.5,
  fontWeight: 500,
  color: DANGER,
  marginTop: 6,
};

/** The invalid state of a text input — the shared `input` style plus the ring. */
export function invalidInput(base: CSSProperties = input): CSSProperties {
  return {
    ...base,
    borderColor: DANGER,
    boxShadow: `0 0 0 3px ${DANGER_SOFT}`,
  };
}

/**
 * Wraps one control with its message.
 *
 * The `data-cofield` attribute is the handle `useCheckout` uses to scroll to and
 * focus the first offending field after a refused submit — an error the shopper
 * has to go hunting for is barely better than no error, and on a phone the
 * failing field is usually off-screen.
 */
export function Field({
  name,
  error,
  children,
}: {
  /**
   * Open-ended alongside the known fields: the merchant's own checkout fields
   * key their errors as `custom:<key>`, and their names are not knowable here.
   */
  name: FieldName | (string & {});
  error?: string;
  children: ReactNode;
}) {
  return (
    <div data-cofield={name}>
      {children}
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}

/** The message itself. Reached through `Field`, which is what guarantees the
 *  `data-cofield` focus handle travels with every message. */
function FieldError({ children }: { children: ReactNode }) {
  return (
    <div role="alert" style={errorText}>
      <span style={{ display: "flex", flex: "none" }}>
        <Icon name="alert" size={13} />
      </span>
      <span>{children}</span>
    </div>
  );
}

/**
 * The form-level banner shown when Place order is refused.
 *
 * It exists because the per-field messages can all be below the fold: the banner
 * answers "why did nothing happen when I pressed the button" at the point the
 * shopper pressed it, and the field messages answer "what do I change".
 */
export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 9,
        border: `1px solid ${DANGER}`,
        background: DANGER_SOFT,
        color: DANGER,
        borderRadius: "var(--radius-md)",
        padding: "11px 13px",
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.5,
        marginBottom: 14,
      }}
    >
      <span style={{ display: "flex", flex: "none", marginTop: 1 }}>
        <Icon name="alert" size={15} />
      </span>
      <span>{children}</span>
    </div>
  );
}
