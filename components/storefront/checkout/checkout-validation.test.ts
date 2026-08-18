import { describe, expect, it } from "vitest";
import {
  checkoutErrors,
  firstInvalidField,
  type CheckoutValidationInput,
} from "./checkout-validation";
import type { Dict } from "@/lib/storefront-i18n";

/**
 * These rules used to be three booleans inside `useCheckout`
 * (`contactComplete` / `deliveryComplete` / `addressComplete`), which is why
 * five of the six fields could be wrong without ever saying so — a boolean has
 * nowhere to put a reason. They were extracted here so they could be checked
 * without a store, a cart or a signed-in shopper. This is that check.
 *
 * Messages are asserted by their dictionary KEY, not their English text, so a
 * copy edit doesn't fail the suite — what matters is that the right field gets
 * the right explanation.
 */

// The dictionary is ~600 keys and only these are read; the cast keeps the
// fixture honest about that rather than pretending to build a whole Dict.
const t = {
  nameRequired: "nameRequired",
  phoneRequired: "phoneRequired",
  phoneInvalid: "phoneInvalid",
  addressRequired: "addressRequired",
  districtRequired: "districtRequired",
  areaRequired: "areaRequired",
  termsRequiredError: "termsRequiredError",
} as unknown as Dict;

/** A complete delivery order for a store that requires name/phone/address. */
const base = (over: Partial<CheckoutValidationInput> = {}): CheckoutValidationInput => ({
  t,
  addr: { name: "Rashidul Karim", phone: "01712345678", address: "House 42, Road 7" },
  geo: { district: "Dhaka", area: "Dhanmondi" },
  required: new Set(["name", "phone", "address"]),
  needArea: true,
  isPickup: false,
  phoneUsable: true,
  phoneMalformed: false,
  termsRequired: false,
  termsAccepted: false,
  ...over,
});

describe("checkoutErrors", () => {
  it("says nothing about a complete order", () => {
    expect(checkoutErrors(base())).toEqual({});
  });

  it("flags each missing required field with its OWN message", () => {
    const errors = checkoutErrors(
      base({
        addr: { name: "", phone: "", address: "" },
        geo: { district: "", area: "" },
      }),
    );
    // The point of the change: four blanks produce four different sentences,
    // not one "Required" repeated four times.
    expect(errors).toEqual({
      name: "nameRequired",
      phone: "phoneRequired",
      address: "addressRequired",
      district: "districtRequired",
    });
  });

  it("respects the merchant's required-field config", () => {
    const errors = checkoutErrors(
      base({
        required: new Set(["phone"]),
        needArea: false,
        addr: { name: "", phone: "", address: "" },
        geo: { district: "", area: "" },
      }),
    );
    expect(errors).toEqual({ phone: "phoneRequired" });
  });

  // Zone shipping PRICES the order from the district, so it overrides the
  // merchant's config — matching the backend's own enforcement in placeOrder.
  it("forces district+area when zone shipping is on, whatever the config says", () => {
    const errors = checkoutErrors(
      base({
        required: new Set(["name", "phone"]),
        needArea: true,
        geo: { district: "", area: "" },
      }),
    );
    expect(errors.district).toBe("districtRequired");
  });

  it("does not ask for an area until a district narrows the list", () => {
    const blank = checkoutErrors(base({ geo: { district: "", area: "" } }));
    // Area is not "missing" yet — it is a field the shopper cannot fill.
    expect(blank.district).toBe("districtRequired");
    expect(blank.area).toBeUndefined();

    const picked = checkoutErrors(base({ geo: { district: "Dhaka", area: "" } }));
    expect(picked.district).toBeUndefined();
    expect(picked.area).toBe("areaRequired");
  });

  describe("the phone, which is a guest's identity", () => {
    it("asks for one when it is blank", () => {
      const errors = checkoutErrors(
        base({ addr: { name: "R", phone: "", address: "x" }, phoneUsable: false }),
      );
      expect(errors.phone).toBe("phoneRequired");
    });

    // Two different problems with two different fixes. Collapsing them sends
    // someone who typed a landline looking for an empty field.
    it("rejects a typed-but-malformed number with the FORMAT message", () => {
      const errors = checkoutErrors(
        base({
          addr: { name: "R", phone: "0431 55 22", address: "x" },
          phoneUsable: false,
          phoneMalformed: true,
        }),
      );
      expect(errors.phone).toBe("phoneInvalid");
    });

    it("stays silent on a blank phone the merchant did not require", () => {
      const errors = checkoutErrors(
        base({
          required: new Set(["name"]),
          needArea: false,
          addr: { name: "R", phone: "", address: "" },
          phoneUsable: false,
        }),
      );
      expect(errors.phone).toBeUndefined();
    });
  });

  describe("pickup", () => {
    it("drops every delivery field", () => {
      const errors = checkoutErrors(
        base({
          isPickup: true,
          addr: { name: "R", phone: "01712345678", address: "" },
          geo: { district: "", area: "" },
        }),
      );
      expect(errors).toEqual({});
    });

    it("still needs the contact fields — the parcel is handed to somebody", () => {
      const errors = checkoutErrors(
        base({
          isPickup: true,
          addr: { name: "", phone: "", address: "" },
          geo: { district: "", area: "" },
        }),
      );
      expect(errors).toEqual({ name: "nameRequired", phone: "phoneRequired" });
    });
  });

  describe("terms", () => {
    it("is silent when the merchant does not require them", () => {
      expect(checkoutErrors(base({ termsRequired: false })).terms).toBeUndefined();
    });

    it("blocks on an unticked box when they are required", () => {
      const errors = checkoutErrors(base({ termsRequired: true, termsAccepted: false }));
      expect(errors.terms).toBe("termsRequiredError");
    });

    it("clears once ticked", () => {
      expect(checkoutErrors(base({ termsRequired: true, termsAccepted: true })).terms)
        .toBeUndefined();
    });
  });

  it("treats whitespace as blank — a space is not an address", () => {
    const errors = checkoutErrors(
      base({
        addr: { name: "   ", phone: "01712345678", address: "  " },
        geo: { district: "  ", area: "  " },
      }),
    );
    expect(errors.name).toBe("nameRequired");
    expect(errors.address).toBe("addressRequired");
    expect(errors.district).toBe("districtRequired");
  });
});

/**
 * The focus order after a refused submit. It must match the visual order of the
 * form, or the page scrolls to the second problem and the shopper never sees
 * the first.
 */
describe("firstInvalidField", () => {
  it("is null when nothing is wrong", () => {
    expect(firstInvalidField({})).toBeNull();
  });

  it("picks the earliest field in form order, not object order", () => {
    expect(firstInvalidField({ terms: "t", district: "d", name: "n" })).toBe("name");
    expect(firstInvalidField({ terms: "t", area: "a" })).toBe("area");
    expect(firstInvalidField({ terms: "t" })).toBe("terms");
  });

  it("agrees with checkoutErrors on a wholly empty delivery form", () => {
    const errors = checkoutErrors(
      base({
        addr: { name: "", phone: "", address: "" },
        geo: { district: "", area: "" },
        termsRequired: true,
      }),
    );
    expect(firstInvalidField(errors)).toBe("name");
  });
});
