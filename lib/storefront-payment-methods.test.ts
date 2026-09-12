// coding-standard: maintained
/**
 * Resolving what to CALL a payment method, now that methods are merchant data.
 *
 * The hard case is time: an id is permanent, a title is not. A merchant can
 * rename a method or delete it outright long after an order was placed, and that
 * order still has to print correctly. Hence the precedence these pin — snapshot,
 * then the store's current definition, then the translated dictionary.
 */
import { describe, expect, it } from "vitest";
import {
  adminPaymentMethodLabel,
  storefrontPaymentIcon,
  storefrontPaymentMethodLabel,
  storefrontPaymentMethodSubtitle,
} from "./storefront-payment-methods";

const labels = {
  cod: "Cash on Delivery",
  bankTransfer: "Bank Transfer",
  customPayment: "Custom payment",
};

const methods = [
  { id: "bkash", title: "bKash payment", subtitle: "Send Money, then enter the TrxID" },
  { id: "bank", title: "Bank Transfer" },
];

describe("storefrontPaymentMethodLabel", () => {
  it("uses the store's current definition for a live checkout", () => {
    // No order exists yet, so there is nothing to have snapshotted.
    expect(storefrontPaymentMethodLabel("bkash", labels, methods)).toBe("bKash payment");
  });

  it("prefers an order's snapshot over the store's current wording", () => {
    // The merchant has since renamed it. The order must still say what the
    // shopper actually chose — that is the whole reason the snapshot is stored.
    const renamed = [{ id: "bkash", title: "Nagad payment" }];
    expect(storefrontPaymentMethodLabel("bkash", labels, renamed, "bKash payment")).toBe(
      "bKash payment",
    );
  });

  it("still reads correctly for a method the merchant DELETED", () => {
    // Nothing defines `bkash` any more; only the snapshot remembers it.
    expect(storefrontPaymentMethodLabel("bkash", labels, [], "bKash payment")).toBe(
      "bKash payment",
    );
  });

  it("translates cod rather than reading merchant data", () => {
    expect(storefrontPaymentMethodLabel("cod", labels, methods)).toBe("Cash on Delivery");
  });

  it("lets a merchant's own wording override the legacy bank translation", () => {
    // `bank` is an ordinary merchant method after the backfill, so a store that
    // renamed it must see the new name, not the dictionary's.
    const renamed = [{ id: "bank", title: "Direct deposit — City Bank" }];
    expect(storefrontPaymentMethodLabel("bank", labels, renamed)).toBe(
      "Direct deposit — City Bank",
    );
  });

  it("falls back to the bank translation when nothing defines it", () => {
    // A store whose backfill has not run yet. It must not render a raw id.
    expect(storefrontPaymentMethodLabel("bank", labels, [])).toBe("Bank Transfer");
  });

  it("renders an unknown id as itself rather than blank", () => {
    expect(storefrontPaymentMethodLabel("rocket", labels, [])).toBe("rocket");
  });
});

describe("storefrontPaymentMethodSubtitle", () => {
  it("returns the merchant's subtitle", () => {
    expect(storefrontPaymentMethodSubtitle("bkash", methods)).toBe(
      "Send Money, then enter the TrxID",
    );
  });

  it("returns undefined when there is none, so no empty line renders", () => {
    expect(storefrontPaymentMethodSubtitle("bank", methods)).toBeUndefined();
    expect(storefrontPaymentMethodSubtitle("cod", methods)).toBeUndefined();
  });
});

describe("adminPaymentMethodLabel", () => {
  it("shows the merchant their own wording, not a platform word", () => {
    // The person packing the order needs to know which wallet was paid.
    expect(adminPaymentMethodLabel("bkash", undefined, "bKash payment")).toBe(
      "bKash payment",
    );
  });

  it("keeps COD an initialism and `manual` the admin's own word", () => {
    expect(adminPaymentMethodLabel("cod")).toBe("COD");
    expect(adminPaymentMethodLabel("manual")).toBe("Manual");
  });

  it("degrades to something readable with neither snapshot nor settings", () => {
    // What the order list renders before settings have loaded.
    expect(adminPaymentMethodLabel("bank")).toBe("Bank");
    expect(adminPaymentMethodLabel("bkash")).toBe("bkash");
  });
});

describe("storefrontPaymentIcon", () => {
  /**
   * There is no "no icon" answer, deliberately: a payment row with a blank space
   * where a mark should be reads as broken, and that is exactly what shipped
   * before this — merchant methods looked up a table that only knew `cod` and
   * `bank`, so every one of them rendered nothing.
   */
  it("uses the merchant's choice", () => {
    expect(storefrontPaymentIcon("bkash", [{ id: "bkash", icon: "phone" }])).toBe("phone");
  });

  it("keeps the marks we ship for cod and bank", () => {
    expect(storefrontPaymentIcon("cod")).toBe("coins");
    expect(storefrontPaymentIcon("bank")).toBe("bank");
  });

  it("lets a merchant override even those", () => {
    // They renamed `bank` to "Pay at our shop"; a bank building is now wrong.
    expect(storefrontPaymentIcon("bank", [{ id: "bank", icon: "coins" }])).toBe("coins");
  });

  it("falls back to card when the merchant never picked", () => {
    expect(storefrontPaymentIcon("bkash", [{ id: "bkash" }])).toBe("card");
  });

  it("falls back to card for a value this build no longer knows", () => {
    // Shrinking the shipped list must not blank out a live checkout row.
    expect(storefrontPaymentIcon("bkash", [{ id: "bkash", icon: "rocket-ship" }])).toBe(
      "card",
    );
  });

  it("falls back to card for an id nothing defines", () => {
    expect(storefrontPaymentIcon("gone", [])).toBe("card");
  });
});
