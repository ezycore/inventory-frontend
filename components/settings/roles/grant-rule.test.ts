// coding-standard: maintained
/**
 * The builder's half of the "keeping is not granting" rule. The backend half is
 * `custom-role.service.test.ts` → "a delegated role author"; if the two drift,
 * the builder either locks a permission the API would accept or offers one it
 * refuses on Save.
 */
import { describe, expect, it } from "vitest";

import { canTickPermission } from "./grant-rule";

const editor = new Set(["roles.manage", "sales.view", "customers.view"]);
const original = new Set(["sales.view", "customers.delete"]);

describe("canTickPermission", () => {
  it("lets the editor grant what they hold", () => {
    expect(canTickPermission("customers.view", editor, original)).toBe(true);
  });

  it("lets the editor keep what the role already held, even without holding it", () => {
    expect(canTickPermission("customers.delete", editor, original)).toBe(true);
  });

  it("locks a permission the editor lacks and the role never held", () => {
    expect(canTickPermission("customers.edit", editor, original)).toBe(false);
  });

  it("locks nothing for someone holding everything", () => {
    const admin = new Set(["customers.edit", "customers.delete", "sales.view"]);
    expect(canTickPermission("customers.edit", admin, new Set())).toBe(true);
  });
});
