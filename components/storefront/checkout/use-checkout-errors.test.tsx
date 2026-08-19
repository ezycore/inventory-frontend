import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCheckoutErrors } from "./use-checkout-errors";
import {
  CHECKOUT_STEP_FIELDS,
  firstInvalidField,
  type CheckoutErrors,
} from "./checkout-validation";

/**
 * REGRESSION — the stepped checkout's terms dead-end (QA, 2026-08-18).
 *
 * `TermsBlock` renders on **step 3**. When the merchant requires terms, an
 * unticked box is an error from the first render — so a `reveal()` that scanned
 * every field refused to advance step 1, and then tried to focus a
 * `[data-cofield="terms"]` that is not in the DOM until two screens later. The
 * shopper saw a Continue button that did nothing, forever, with nothing on
 * screen to fix: a required-terms stepped checkout could not be completed at
 * all.
 *
 * The rule these tests pin: **a step may only be blocked by the fields it
 * actually renders.** Terms and the minimum order are final-submit concerns.
 */

const termsOnly: CheckoutErrors = { terms: "termsRequiredError" };
const nameAndTerms: CheckoutErrors = {
  name: "nameRequired",
  terms: "termsRequiredError",
};

describe("CHECKOUT_STEP_FIELDS", () => {
  it("keeps terms off step 1 — it is not rendered until step 3", () => {
    expect(CHECKOUT_STEP_FIELDS[1]).not.toContain("terms");
    expect(CHECKOUT_STEP_FIELDS[3]).toContain("terms");
  });

  // If a field is listed against a step that does not render it, that step
  // becomes unleavable and unfixable — which is exactly the bug.
  it("lists every field exactly once across the three steps", () => {
    const all = [1, 2, 3].flatMap((s) => CHECKOUT_STEP_FIELDS[s]);
    expect([...new Set(all)]).toHaveLength(all.length);
    expect(all.sort()).toEqual(
      ["address", "area", "district", "name", "phone", "terms"].sort(),
    );
  });
});

describe("firstInvalidField scoping", () => {
  it("ignores an out-of-scope error", () => {
    expect(firstInvalidField(termsOnly)).toBe("terms");
    expect(firstInvalidField(termsOnly, CHECKOUT_STEP_FIELDS[1])).toBeNull();
  });

  it("still reports an in-scope error when both are present", () => {
    expect(firstInvalidField(nameAndTerms, CHECKOUT_STEP_FIELDS[1])).toBe("name");
  });

  it("keeps form order inside a scope, not the caller's argument order", () => {
    const errors: CheckoutErrors = { area: "a", phone: "p" };
    expect(firstInvalidField(errors, ["area", "phone"])).toBe("phone");
  });
});

describe("useCheckoutErrors.reveal", () => {
  it("ADVANCES step 1 when only the step-3 terms box is unticked", () => {
    const { result } = renderHook(() => useCheckoutErrors(termsOnly));
    let allowed = false;
    act(() => {
      allowed = result.current.reveal(CHECKOUT_STEP_FIELDS[1]);
    });
    expect(allowed).toBe(true);
    // Nothing was revealed either — there was no step-1 problem to point at, so
    // painting the form red would be a false alarm.
    expect(result.current.revealed).toBe(false);
  });

  it("REFUSES step 1 when a step-1 field is genuinely missing", () => {
    const { result } = renderHook(() => useCheckoutErrors(nameAndTerms));
    let allowed = true;
    act(() => {
      allowed = result.current.reveal(CHECKOUT_STEP_FIELDS[1]);
    });
    expect(allowed).toBe(false);
    expect(result.current.revealed).toBe(true);
  });

  // The safety invariant. Scoping must never become a way to order without
  // accepting terms the merchant requires — the final submit passes no scope.
  it("still refuses the unscoped submit that terms guard", () => {
    const { result } = renderHook(() => useCheckoutErrors(termsOnly));
    let allowed = true;
    act(() => {
      allowed = result.current.reveal();
    });
    expect(allowed).toBe(false);
  });

  it("advances a step whose scope is empty (payment has nothing to validate)", () => {
    const { result } = renderHook(() => useCheckoutErrors(nameAndTerms));
    let allowed = false;
    act(() => {
      allowed = result.current.reveal(CHECKOUT_STEP_FIELDS[2]);
    });
    expect(allowed).toBe(true);
  });
});
