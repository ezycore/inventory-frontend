"use client";
// coding-standard: maintained

import { useCallback, useMemo, useState } from "react";
import {
  firstInvalidField,
  type CheckoutErrors,
  type CheckoutField,
} from "@/components/storefront/checkout/checkout-validation";

/**
 * WHEN a checkout error is allowed to be on screen.
 *
 * `checkout-validation` says whether a field is wrong; this says whether the
 * shopper should be looking at that yet, and the distinction is the whole
 * ergonomics of the form:
 *
 * - **On blur** — you left a field, so you are done with it. An error on an
 *   empty field you have not reached yet is nagging, not helping.
 * - **On a refused submit** — everything, at once, plus the page scrolled to the
 *   first one. This is the case the old checkout had no answer for: the button
 *   was simply disabled, so pressing it did nothing and said nothing.
 *
 * Errors also **clear as you type**, because `errors` is recomputed from live
 * state — nothing is latched. A field that is fixed stops complaining without
 * needing a second blur.
 */
export interface CheckoutErrorState {
  /** Only the errors the shopper has earned the right to see. */
  visible: CheckoutErrors;
  /** True once a submit (or step advance) has been refused. */
  revealed: boolean;
  /** Mark a field as "left" — call from the control's `onBlur`. */
  touch: (field: CheckoutField) => void;
  /**
   * Show everything and jump to the first problem. Returns `true` when there was
   * nothing to reveal, i.e. the caller may proceed.
   */
  reveal: () => boolean;
}

export function useCheckoutErrors(errors: CheckoutErrors): CheckoutErrorState {
  const [touched, setTouched] = useState<Partial<Record<CheckoutField, true>>>({});
  const [revealed, setRevealed] = useState(false);

  const touch = useCallback((field: CheckoutField) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  }, []);

  const visible = useMemo<CheckoutErrors>(() => {
    if (revealed) return errors;
    const shown: CheckoutErrors = {};
    for (const key of Object.keys(errors) as CheckoutField[]) {
      if (touched[key]) shown[key] = errors[key];
    }
    return shown;
  }, [errors, revealed, touched]);

  const reveal = useCallback(() => {
    const first = firstInvalidField(errors);
    if (!first) return true;
    setRevealed(true);
    // After paint, or the field is still rendering without its message and the
    // scroll lands a row short of where the shopper needs to look.
    requestAnimationFrame(() => focusField(first));
    return false;
  }, [errors]);

  return { visible, revealed, touch, reveal };
}

/** Scroll the offending field into view and put the caret in it. */
function focusField(field: CheckoutField) {
  const host = document.querySelector<HTMLElement>(`[data-cofield="${field}"]`);
  if (!host) return;
  host.scrollIntoView({ behavior: "smooth", block: "center" });
  // `preventScroll` so the focus does not fight the smooth scroll above — on a
  // phone the two together land somewhere neither asked for.
  host.querySelector<HTMLElement>("input, select, textarea")?.focus({ preventScroll: true });
}
