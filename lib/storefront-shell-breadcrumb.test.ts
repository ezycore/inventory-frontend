import { describe, expect, it } from "vitest";
import type { Dict } from "@/lib/storefront-i18n";
import { shellCrumbLabel } from "@/lib/storefront-shell-breadcrumb";

const labels = {
  navShop: "Shop",
  navSearch: "Search",
  navCart: "Cart",
  navCheckout: "Checkout",
  navAccount: "Account",
} as Dict;

describe("shellCrumbLabel", () => {
  it("leaves product detail breadcrumbs to the product page", () => {
    expect(shellCrumbLabel("/shop/products/coffee", labels)).toBe("");
    expect(shellCrumbLabel("/products/coffee", labels)).toBe("");
    expect(shellCrumbLabel("/shop/products/coffee/", labels)).toBe("");
  });

  it("keeps shell-owned route labels", () => {
    expect(shellCrumbLabel("/shop/products", labels)).toBe("Shop");
    expect(shellCrumbLabel("/shop/search", labels)).toBe("Search");
    expect(shellCrumbLabel("/shop/cart", labels)).toBe("Cart");
    expect(shellCrumbLabel("/shop/checkout", labels)).toBe("Checkout");
    expect(shellCrumbLabel("/shop/account", labels)).toBe("Account");
  });
});
