// coding-standard: maintained

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Every surface that prints a shopper's own details as TEXT carries
 * `data-clarity-mask="true"` (backend `docs/plan/storefront-clarity.md` §7.3).
 *
 * **Clarity masks form inputs, numbers and email addresses by default — it does not mask text.**
 * So a name typed into checkout is safe and the same name echoed back on the order card is not,
 * and the difference is invisible in every screenshot. A merchant owns their own Clarity project
 * and controls who can sign into it; the only thing standing between a shopper's phone number
 * and that replay is the attribute this test pins.
 *
 * A source scan rather than a render assertion on purpose: the point is that the attribute
 * survives a refactor of files this test does not otherwise know how to mount, and a deleted
 * attribute must fail here rather than in somebody's session recording.
 */
const MASKED = {
  "components/storefront/checkout/checkout-address-book.tsx":
    "saved addresses offered at checkout",
  "components/storefront/checkout/order-placed-card.tsx":
    "the order number and the guest's own tracking link",
  "components/storefront/account/addresses-section.tsx":
    "the shopper's saved address book",
  "components/storefront/account/orders-section.tsx":
    "the shopper's order history",
  "components/storefront/account/profile-section.tsx":
    "name, phone, email, date of birth",
  "components/storefront/account/tracking-section.tsx":
    "one order's delivery detail",
  "components/storefront/tracked-order-panel.tsx":
    "the tokenised tracking page, which needs no login",
};

describe("Clarity masking", () => {
  for (const [file, what] of Object.entries(MASKED)) {
    it(`masks ${what} (${file})`, () => {
      // Resolved from the repo root (vitest runs there) rather than from `import.meta.url`,
      // which the transform does not populate here.
      const source = readFileSync(join(process.cwd(), file), "utf8");
      expect(source).toContain('data-clarity-mask="true"');
    });
  }
});
