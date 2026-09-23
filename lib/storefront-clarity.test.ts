import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  setClarityConsent,
  setClarityPageType,
  storefrontPageType,
  upgradeClaritySession,
} from "@/lib/storefront-clarity";

/**
 * The page-type classifier and the three `window.clarity` calls.
 *
 * The classifier is worth a test out of proportion to its size: it is what turns a merchant's
 * Clarity dashboard from a pile of sessions into per-surface heatmaps, and it is derived from a
 * pathname that is spelled differently on a subdomain (`/shop/...`) than on a custom domain
 * (`/...`). A merchant who moves onto their own domain must not see every session refile itself
 * into one bucket.
 */
describe("storefrontPageType", () => {
  it("classifies the same store identically on both hosting shapes", () => {
    const pairs: [string, string][] = [
      ["/shop", "/"],
      ["/shop/", "/"],
      ["/shop/products/panjabi", "/products/panjabi"],
      ["/shop/cart", "/cart"],
      ["/shop/checkout", "/checkout"],
      ["/shop/search?q=x", "/search?q=x"],
      ["/shop/electronics/phones", "/electronics/phones"],
    ];
    for (const [subdomain, customDomain] of pairs) {
      expect(storefrontPageType(subdomain)).toBe(
        storefrontPageType(customDomain),
      );
    }
  });

  it("names each surface", () => {
    expect(storefrontPageType("/")).toBe("home");
    expect(storefrontPageType("/shop")).toBe("home");
    expect(storefrontPageType("/products/panjabi")).toBe("product");
    expect(storefrontPageType("/search")).toBe("search");
    expect(storefrontPageType("/cart")).toBe("cart");
    expect(storefrontPageType("/checkout")).toBe("checkout");
    expect(storefrontPageType("/orders/1024")).toBe("order");
    // The tokenised tracking link a guest reaches with no login.
    expect(storefrontPageType("/t/abc123")).toBe("order");
    expect(storefrontPageType("/account")).toBe("account");
    expect(storefrontPageType("/pages/return-policy")).toBe("page");
    expect(storefrontPageType("/campaigns/eid")).toBe("page");
  });

  it("falls back to the category catch-all, which is most of the site", () => {
    expect(storefrontPageType("/electronics")).toBe("category");
    expect(storefrontPageType("/electronics/phones/accessories")).toBe("category");
  });

  it("does not mistake a category that merely starts with a surface name", () => {
    // `[...categoryPath]` serves any slug, and a shop really can have a "production" category.
    expect(storefrontPageType("/productions")).toBe("category");
  });
});

describe("clarity calls", () => {
  const clarity = vi.fn();

  beforeEach(() => {
    clarity.mockClear();
    window.clarity = clarity;
  });
  afterEach(() => {
    delete window.clarity;
  });

  it("tags the page type and upgrades a session", () => {
    setClarityPageType("checkout");
    upgradeClaritySession("checkout");
    expect(clarity).toHaveBeenNthCalledWith(1, "set", "page_type", "checkout");
    expect(clarity).toHaveBeenNthCalledWith(2, "upgrade", "checkout");
  });

  it("never grants advertising storage, whatever the shopper answered", () => {
    setClarityConsent(true);
    setClarityConsent(false);
    expect(clarity).toHaveBeenNthCalledWith(1, "consentv2", {
      ad_Storage: "denied",
      analytics_Storage: "granted",
    });
    // A refusal is sent explicitly rather than left silent — the state has to be the result of
    // a recorded choice, not of an effect that never ran.
    expect(clarity).toHaveBeenNthCalledWith(2, "consentv2", {
      ad_Storage: "denied",
      analytics_Storage: "denied",
    });
  });

  it("swallows an ad blocker", () => {
    // Roughly a third of shoppers block this script. A tracking call must never throw into a
    // click handler — the shopper's next tap is Add to cart.
    delete window.clarity;
    expect(() => setClarityPageType("home")).not.toThrow();

    window.clarity = () => {
      throw new Error("blocked");
    };
    expect(() => setClarityConsent(true)).not.toThrow();
  });
});
