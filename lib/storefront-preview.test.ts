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
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  PAGE_EDITOR_ATTR,
  PREVIEW_API_HEADER,
  PREVIEW_COOKIE,
  PREVIEW_SESSION_KEY,
  isPageEditorFrame,
  isPreviewSession,
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
  window.sessionStorage.clear();
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

describe("isPreviewSession", () => {
  it("is false for an ordinary shopper", () => {
    expect(isPreviewSession()).toBe(false);
    // …and leaves nothing behind that a later page load could misread.
    expect(window.sessionStorage.getItem(PREVIEW_SESSION_KEY)).toBeNull();
  });

  it("is true on the frame's first URL, and remembers it", () => {
    setSearch("?preview=1");

    expect(isPreviewSession()).toBe(true);
    expect(window.sessionStorage.getItem(PREVIEW_SESSION_KEY)).toBe("1");
  });

  it("survives the click that drops the param, and the reload after it", () => {
    // The shipped bug: every storefront link is a bare path, so one click
    // inside the preview navigates the frame to a param-less URL. Reading the
    // URL alone, the next document mounted no receiver and the editor's edits
    // stopped landing — the preview froze on its last paint until the merchant
    // reloaded the editor.
    setSearch("?preview=1");
    isPreviewSession();

    setSearch("/gadgets");

    expect(isPreviewSession()).toBe(true);
  });

  it("does not follow the merchant into a different tab", () => {
    // `sessionStorage` is per tab, so this is really a test that we did not
    // reach for `localStorage` — which would have put the merchant's own shop
    // window into preview mode for good.
    setSearch("?preview=1");
    isPreviewSession();

    // A fresh tab: empty storage, and the shop's own URL rather than the
    // editor's.
    window.sessionStorage.clear();
    setSearch("/gadgets");

    expect(isPreviewSession()).toBe(false);
  });

  it("falls back to the URL when storage throws", () => {
    // Private windows and blocked site data throw on access. Degrading to the
    // old behaviour is fine; throwing out of a receiver's effect is not.
    const spy = vi
      .spyOn(window.sessionStorage, "setItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    setSearch("?preview=1");

    expect(isPreviewSession()).toBe(true);
    spy.mockRestore();
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

/**
 * The header search and the cart drawer navigate with `router.push`, which the
 * page editor's link capture cannot see — they ask this instead.
 */
describe("isPageEditorFrame", () => {
  afterEach(() => document.documentElement.removeAttribute(PAGE_EDITOR_ATTR));

  it("is false until the page editor has driven the frame, then true", () => {
    expect(isPageEditorFrame()).toBe(false);
    document.documentElement.setAttribute(PAGE_EDITOR_ATTR, "");
    expect(isPageEditorFrame()).toBe(true);
  });
});
