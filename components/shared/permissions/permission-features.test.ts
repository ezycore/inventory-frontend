// coding-standard: maintained
/**
 * The read-only permission lists hide what the role builder hides. The `start`
 * case matches `inventory-backend/src/utils/__tests__/permission-catalog.test.ts`
 * — if one side changes and the other does not, the builder and the role
 * details drawer disagree about what a role can do.
 */
import { describe, expect, it } from "vitest";

import type { OrganizationFeatures } from "@/types";
import { isPermissionVisible, visiblePermissions } from "./permission-features";

const ALL_ON: OrganizationFeatures = {
  sales: true,
  accounts: true,
  expiryTracking: true,
  barcodeSystem: true,
  invoicePrinting: true,
  returns: true,
  uomConversion: true,
  storefront: true,
  tax: true,
  combo: true,
  smsNotifications: true,
  multiLocation: true,
  purchases: true,
  inventoryTracking: true,
};

const START: OrganizationFeatures = {
  ...ALL_ON,
  sales: false,
  tax: false,
  inventoryTracking: false,
  purchases: false,
  multiLocation: false,
  expiryTracking: false,
  combo: false,
  uomConversion: false,
};

describe("isPermissionVisible", () => {
  it("shows everything when every feature is on", () => {
    for (const permission of ["purchases.view", "stock.manage", "sales.create", "taxes.edit"]) {
      expect(isPermissionVisible(permission, ALL_ON)).toBe(true);
    }
  });

  it("hides nothing before the feature map has loaded", () => {
    expect(isPermissionVisible("purchases.view", undefined)).toBe(true);
  });

  it("hides purchasing, suppliers, stock, discounts, VAT and the counter on the start tier", () => {
    for (const hidden of [
      "purchases.view",
      "suppliers.edit",
      "stock.manage",
      "discounts.view",
      "taxes.view",
      "sales.create",
    ]) {
      expect(isPermissionVisible(hidden, START)).toBe(false);
    }
    for (const shown of [
      "sales.view",
      "sales.edit",
      "returns.create",
      "locations.view",
      "locations.all",
      "storefront.manage",
      "accounts.view",
      "customers.view",
      "products.view",
    ]) {
      expect(isPermissionVisible(shown, START)).toBe(true);
    }
  });

  it("hides accounts and transactions together", () => {
    const off = { ...ALL_ON, accounts: false };
    expect(visiblePermissions(["accounts.view", "transactions.capital", "products.view"], off)).toEqual([
      "products.view",
    ]);
  });

  it("hides returns only when no ledger could produce one", () => {
    const noLedger = { ...ALL_ON, sales: false, storefront: false, purchases: false };
    expect(isPermissionVisible("returns.view", noLedger)).toBe(false);
    expect(isPermissionVisible("returns.view", { ...ALL_ON, returns: false })).toBe(false);
  });
});
