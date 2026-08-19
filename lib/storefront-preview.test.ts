// coding-standard: maintained
/**
 * How the storefront finds its owner-preview token in the browser.
 *
 * Worth pinning because both readers are string surgery against ambient global
 * state, and both fail *silently*: a wrong offset or a loose prefix match yields
 * a token-shaped string that the API simply refuses, and the only symptom is the
 * merchant's own shop 404ing in the preview pane with nothing in the console.
 *
 * See `lib/storefront-preview.ts` for the route the token travels.
 */
import { afterEach, describe, expect, it } from "vitest";

import {
  PREVIEW_API_HEADER,
  PREVIEW_COOKIE,
  previewApiHeaders,
  setStorefrontPreviewToken,
  storefrontPreviewToken,
} from "@/lib/storefront-preview";

/** jsdom keeps cookies per document; clear the one we set between cases. */
const clearCookie = () => {
  document.cookie = `${PREVIEW_COOKIE}=; max-age=0; path=/`;
};

const setSearch = (search: string) => {
  window.history.replaceState({}, "", `/shop${search}`);
};

afterEach(() => {
  setStorefrontPreviewToken(null);
  clearCookie();
  setSearch("");
});

describe("storefrontPreviewToken", () => {
  it("returns null for an ordinary shopper — no param, no cookie, nothing injected", () => {
    expect(storefrontPreviewToken()).toBeNull();
  });

  it("reads the token out of the page URL", () => {
    setSearch("?preview=1&previewToken=abc.def.ghi");

    expect(storefrontPreviewToken()).toBe("abc.def.ghi");
  });

  it("falls back to the cookie once a client-side navigation has dropped the param", () => {
    document.cookie = `${PREVIEW_COOKIE}=cookie.token.value; path=/`;
    setSearch("/products");

    expect(storefrontPreviewToken()).toBe("cookie.token.value");
  });

  it("picks the right cookie out of several, and does not mangle its value", () => {
    // A JWT has two dots and base64url padding; a wrong `slice` offset here
    // returns something that still looks like a token.
    document.cookie = "auth-token=staff.session.value; path=/";
    document.cookie = `${PREVIEW_COOKIE}=hdr.pay-load_9.sig; path=/`;
    document.cookie = "active-location=abc123; path=/";

    expect(storefrontPreviewToken()).toBe("hdr.pay-load_9.sig");
  });

  it("does not match a cookie whose name merely starts the same", () => {
    document.cookie = `${PREVIEW_COOKIE}-legacy=wrong.token.value; path=/`;

    expect(storefrontPreviewToken()).toBeNull();
  });

  it("prefers an injected token over the ambient ones (the admin editor's case)", () => {
    // The admin is on a different origin from the shop, so it has neither a
    // param nor a cookie of its own — but it must never read a stale one either.
    document.cookie = `${PREVIEW_COOKIE}=stale.cookie.token; path=/`;
    setSearch("?previewToken=url.token.value");
    setStorefrontPreviewToken("minted.token.value");

    expect(storefrontPreviewToken()).toBe("minted.token.value");
  });
});

describe("previewApiHeaders", () => {
  it("adds nothing at all when there is no token", () => {
    // Spread into every public storefront request, so an empty object is what
    // keeps a normal shopper's call byte-identical to what it was before.
    expect(previewApiHeaders(null)).toEqual({});
  });

  it("names the header the backend middleware reads", () => {
    expect(previewApiHeaders("t.o.k")).toEqual({ [PREVIEW_API_HEADER]: "t.o.k" });
  });
});
