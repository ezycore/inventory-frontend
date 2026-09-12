// coding-standard: maintained
/**
 * Two editors, one stored array — and exactly one editor per entry.
 *
 * The rule is meant to be sayable in one sentence: **an entry in the Checkout tab
 * is asked on every order; an entry under a payment method is asked only for that
 * method.** So ownership is just whether the entry carries a payment-method
 * condition. These pin that, and the merge that keeps each editor from deleting
 * the other's work — both tabs write `checkout.customFields`, and that PATCH
 * replaces the array WHOLESALE.
 */
import { describe, expect, it } from "vitest";
import type { CheckoutField } from "@/types";
import {
  isMethodOwnedField,
  mergeCheckoutFieldGroup,
  methodOwnerId,
} from "./checkout-custom-fields";

const field = (key: string, paymentMethods?: string[]): CheckoutField =>
  ({
    key,
    kind: "input",
    label: key,
    type: "text",
    ...(paymentMethods ? { showWhen: { paymentMethods } } : {}),
  }) as CheckoutField;

describe("ownership", () => {
  it("gives a conditioned entry to the Payments tab", () => {
    expect(isMethodOwnedField(field("trx", ["bkash"]))).toBe(true);
    expect(methodOwnerId(field("trx", ["bkash"]))).toBe("bkash");
  });

  it("gives an unconditional entry to the Checkout tab", () => {
    expect(isMethodOwnedField(field("gift"))).toBe(false);
    expect(methodOwnerId(field("gift"))).toBeUndefined();
  });

  it("keeps a legacy multi-method entry visible in ONE editor", () => {
    // It predates the picker's removal, or was written straight into the
    // database. Showing it under its first method is the point: the alternative
    // is an entry that renders on the storefront and appears in neither tab.
    const legacy = field("ref", ["bkash", "bank"]);
    expect(isMethodOwnedField(legacy)).toBe(true);
    expect(methodOwnerId(legacy)).toBe("bkash");
  });
});

describe("mergeCheckoutFieldGroup", () => {
  const stored = [
    field("gift"),
    field("trx", ["bkash"]),
    field("wallet", ["nagad"]),
    field("delivery-note"),
  ];

  it("saving from Payments keeps the Checkout tab's entries", () => {
    const merged = mergeCheckoutFieldGroup(
      stored,
      [field("trx", ["bkash"])],
      isMethodOwnedField,
    );

    expect(merged.map((f) => f.key)).toEqual(["gift", "trx", "delivery-note"]);
  });

  it("saving from Checkout keeps every method's entries", () => {
    const merged = mergeCheckoutFieldGroup(
      stored,
      [field("gift")],
      (f) => !isMethodOwnedField(f),
    );

    expect(merged.map((f) => f.key)).toEqual(["gift", "trx", "wallet"]);
  });

  it("carries entries for SEVERAL methods through one save", () => {
    // The Payments tab edits every method at once, so its slice spans them all.
    const merged = mergeCheckoutFieldGroup(
      stored,
      [field("trx", ["bkash"]), field("wallet", ["nagad"]), field("ref", ["rocket"])],
      isMethodOwnedField,
    );

    expect(merged.map((f) => f.key)).toEqual([
      "gift",
      "trx",
      "wallet",
      "ref",
      "delivery-note",
    ]);
  });

  it("splices a first-time group in rather than losing it", () => {
    // No method-owned entry stored yet, so there is no position to reuse — it has
    // to land somewhere rather than be dropped for having no anchor.
    const merged = mergeCheckoutFieldGroup(
      [field("gift")],
      [field("trx", ["bkash"])],
      isMethodOwnedField,
    );

    expect(merged.map((f) => f.key)).toEqual(["gift", "trx"]);
  });

  it("deletes a group the merchant emptied", () => {
    // What a deleted payment method leaves behind: its notes go with it.
    const merged = mergeCheckoutFieldGroup(stored, [], isMethodOwnedField);

    expect(merged.map((f) => f.key)).toEqual(["gift", "delivery-note"]);
  });

  it("holds the group's position so interleaved ordering survives a save", () => {
    const merged = mergeCheckoutFieldGroup(
      stored,
      [field("wallet", ["nagad"]), field("trx", ["bkash"])],
      isMethodOwnedField,
    );

    expect(merged.map((f) => f.key)).toEqual([
      "gift",
      "wallet",
      "trx",
      "delivery-note",
    ]);
  });
});
