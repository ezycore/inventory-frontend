// coding-standard: maintained
import { describe, expect, it } from "vitest";

import { paymentMethodForAccount } from "./payment-method";

describe("paymentMethodForAccount", () => {
  it("reads the method off the account the money leaves", () => {
    expect(paymentMethodForAccount("cash")).toBe("cash");
    expect(paymentMethodForAccount("bank")).toBe("bank");
    expect(paymentMethodForAccount("mfs")).toBe("mfs");
  });

  it("records a custom or unknown account as other", () => {
    expect(paymentMethodForAccount("custom")).toBe("other");
    expect(paymentMethodForAccount(undefined)).toBe("other");
  });
});
