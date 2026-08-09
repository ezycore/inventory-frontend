// coding-standard: maintained
/**
 * `pageOf` decides where the launcher is allowed to appear, so its two
 * suppression rules are the tests that matter: a floating green circle printed
 * onto an invoice, and one hovering over the password-reset screen. Neither
 * shows up in typecheck and neither is visible on the page a developer is
 * looking at while building this.
 */
import { describe, expect, it } from "vitest";
import {
  buildContactMessage,
  isPageAllowed,
  pageOf,
} from "@/lib/storefront-contact-message";

const BASE = "/shop";
const at = (path: string) => pageOf(`${BASE}${path}`, BASE);

describe("pageOf", () => {
  it("maps the storefront's real routes", () => {
    expect(at("")).toBe("home");
    expect(at("/")).toBe("home");
    expect(at("/products/aurora-puffer")).toBe("product");
    expect(at("/products")).toBe("collection");
    expect(at("/search")).toBe("collection");
    expect(at("/winter/jackets")).toBe("collection");
    expect(at("/cart")).toBe("cart");
    expect(at("/checkout")).toBe("checkout");
    expect(at("/orders")).toBe("order");
    expect(at("/orders/track")).toBe("order");
    expect(at("/t/abc123")).toBe("order");
    expect(at("/pages/returns")).toBe("page");
    expect(at("/account")).toBe("account");
    expect(at("/account/orders")).toBe("account");
  });

  it("suppresses the printable invoice", () => {
    expect(at("/account/orders/12/invoice")).toBeNull();
  });

  it("suppresses the single-purpose auth interstitials", () => {
    expect(at("/account/verify-email")).toBeNull();
    expect(at("/account/reset-password")).toBeNull();
    expect(at("/account/oauth")).toBeNull();
  });

  // A custom domain serves the same tree from the root, so `base` is "" there
  // (see storeHref). A trailing-slash base must survive too — slicing it off a
  // path eats the path's own leading slash and every prefix test below misses.
  it.each([["custom domain", ""], ["trailing slash", "/"]])(
    "resolves routes at the root (%s)",
    (_name, root) => {
      expect(pageOf("/", root)).toBe("home");
      expect(pageOf("/products/aurora-puffer", root)).toBe("product");
      expect(pageOf("/cart", root)).toBe("cart");
      expect(pageOf("/winter/jackets", root)).toBe("collection");
      expect(pageOf("/account/orders/12/invoice", root)).toBeNull();
    },
  );
});

describe("isPageAllowed", () => {
  it("treats an unset whitelist as every page", () => {
    expect(isPageAllowed(undefined, "home")).toBe(true);
    expect(isPageAllowed([], "checkout")).toBe(true);
  });

  it("honours an explicit whitelist", () => {
    expect(isPageAllowed(["home", "product"], "product")).toBe(true);
    expect(isPageAllowed(["home", "product"], "checkout")).toBe(false);
  });

  it("never allows a suppressed route, whatever the merchant picked", () => {
    expect(isPageAllowed(undefined, null)).toBe(false);
    expect(isPageAllowed(["home", "account"], null)).toBe(false);
  });
});

describe("buildContactMessage", () => {
  it("fills both placeholders", () => {
    expect(
      buildContactMessage("Hi {store}! {context}", "Rashu Store", "About order #RS-1042."),
    ).toBe("Hi Rashu Store! About order #RS-1042.");
  });

  it("removes {context} and its space when the page has none", () => {
    expect(buildContactMessage("Hi {store}! {context}", "Rashu Store")).toBe(
      "Hi Rashu Store!",
    );
  });

  it("never leaks literal braces to the shopper", () => {
    const out = buildContactMessage("Hi {store}! {context}", "Rashu Store");
    expect(out).not.toContain("{");
    expect(out).not.toContain("}");
  });

  it("falls back to a built-in template when the merchant wrote none", () => {
    expect(buildContactMessage(undefined, "Rashu Store")).toBe("Hi Rashu Store!");
    expect(buildContactMessage("   ", "Rashu Store", "Cart help.")).toBe(
      "Hi Rashu Store! Cart help.",
    );
  });

  it("handles a template that uses neither placeholder", () => {
    expect(buildContactMessage("Salaam!", "Rashu Store", "ignored")).toBe("Salaam!");
  });

  it("collapses the whitespace a multi-line template leaves behind", () => {
    expect(buildContactMessage("Hi {store}!\n\n{context}", "Rashu", "Q?")).toBe(
      "Hi Rashu! Q?",
    );
  });
});
