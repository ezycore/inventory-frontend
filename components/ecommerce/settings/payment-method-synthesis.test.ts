// coding-standard: maintained
/**
 * The guard that stops the Payments tab deleting a live payment method.
 *
 * A store created before merchant-defined methods carries
 * `allowedPaymentMethods: ["cod", "bank"]` with an EMPTY `paymentMethods`. The
 * editor builds its rows from `paymentMethods` and the save rebuilds the
 * allow-list from those rows — so without synthesis it would render no rows,
 * write `["cod"]`, and drop bank from a live checkout.
 *
 * The backfill migration writes the same definitions, but depending on it would
 * leave this tab correct only after a migration had run. These pin the behaviour
 * that makes deploy order irrelevant.
 */
import { describe, expect, it } from "vitest";
import { withSynthesizedDefinitions } from "./publish-payment-tabs";

describe("withSynthesizedDefinitions", () => {
  it("invents a definition for an enabled method that has none", () => {
    // The pre-migration shape, and the case that loses data without this.
    expect(withSynthesizedDefinitions([], ["cod", "bank"])).toEqual([
      { id: "bank", title: "Bank Transfer" },
    ]);
  });

  it("titles bank exactly as the migration does, so deploy order cannot matter", () => {
    const synthesized = withSynthesizedDefinitions([], ["bank"]);
    expect(synthesized[0].title).toBe("Bank Transfer");
  });

  it("leaves a store that already has definitions alone", () => {
    const defined = [{ id: "bkash", title: "bKash payment" }];
    expect(withSynthesizedDefinitions(defined, ["cod", "bkash"])).toEqual(defined);
  });

  it("never invents one for cod — the platform owns it", () => {
    expect(withSynthesizedDefinitions([], ["cod"])).toEqual([]);
  });

  it("never invents one for the admin's `manual` id", () => {
    // It is not shopper-facing, so a row for it would offer to publish it.
    expect(withSynthesizedDefinitions([], ["cod", "manual"])).toEqual([]);
  });

  it("uses the raw id as a starting title for anything else", () => {
    // A renameable placeholder beats a blank row the tab refuses to save.
    expect(withSynthesizedDefinitions([], ["rocket"])).toEqual([
      { id: "rocket", title: "rocket" },
    ]);
  });

  it("keeps a defined method and fills only the gap beside it", () => {
    const defined = [{ id: "bkash", title: "bKash payment" }];
    expect(withSynthesizedDefinitions(defined, ["cod", "bkash", "bank"])).toEqual([
      { id: "bkash", title: "bKash payment" },
      { id: "bank", title: "Bank Transfer" },
    ]);
  });

  it("ignores a definition the merchant has but does not currently offer", () => {
    // Switched off, not deleted — it keeps its wording and stays in the list.
    const defined = [{ id: "nagad", title: "Nagad" }];
    expect(withSynthesizedDefinitions(defined, ["cod"])).toEqual(defined);
  });
});
