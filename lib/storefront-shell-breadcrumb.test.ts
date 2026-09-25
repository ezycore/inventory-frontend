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

  it("does not mistake category paths that start with a shell route name", () => {
    expect(shellCrumbLabel("/shop/cushion/cartoon", labels)).toBe("");
    expect(shellCrumbLabel("/shop/cartoon", labels)).toBe("");
    expect(shellCrumbLabel("/shop/accounting-books", labels)).toBe("");
    expect(shellCrumbLabel("/shop/search-lights/led", labels)).toBe("");
  });

  it("strips a custom store base before matching", () => {
    expect(shellCrumbLabel("/cart", labels, "")).toBe("Cart");
    expect(shellCrumbLabel("/cushion/cartoon", labels, "")).toBe("");
    expect(shellCrumbLabel("/s/acme/account/orders", labels, "/s/acme")).toBe("Account");
  });
});
