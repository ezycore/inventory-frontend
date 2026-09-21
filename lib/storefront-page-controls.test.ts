import { describe, expect, it } from "vitest";

import type { StorefrontStore } from "@/lib/storefront-client";
import {
  chromeWithPageControls,
  storePages,
} from "@/lib/storefront-page-controls";
import { resolveMobileChrome } from "@/lib/storefront-mobile";

/**
 * The page controls (§6 of the Storefront Builder plan) and the one rule that
 * protects every shop already running: **absent means ON**.
 *
 * A store configured before these switches existed carries no `pages` block at
 * all, and so does any payload cached before they shipped. Reading the field
 * directly — `store.pages?.search` — is `undefined` there, which is falsy, and
 * would close the search, the cart page and the account area of every existing
 * shop at once, on the deploy rather than on a merchant's decision.
 */
const store = (pages?: StorefrontStore["pages"]): StorefrontStore =>
  ({ name: "Shop", slug: "shop", ...(pages ? { pages } : {}) }) as StorefrontStore;

describe("storePages", () => {
  it("reads a store with no page block as serving every page", () => {
    expect(storePages(store())).toEqual({
      search: true,
      cartPage: true,
      accounts: true,
    });
  });

  it("reads no store at all the same way", () => {
    // The header renders before the store payload resolves, and a shop that
    // flickers its search box away and back on every load is worse than one
    // that never had it.
    expect(storePages(undefined)).toEqual({
      search: true,
      cartPage: true,
      accounts: true,
    });
    expect(storePages(null)).toEqual({
      search: true,
      cartPage: true,
      accounts: true,
    });
  });

  it("switches off only what the merchant switched off", () => {
    expect(
      storePages(store({ search: false, cartPage: true, accounts: true })),
    ).toEqual({ search: false, cartPage: true, accounts: true });
  });
});

describe("chromeWithPageControls", () => {
  /** `tabs` is the chrome every shop had before the templates existed. */
  const tabs = resolveMobileChrome({ mobile: "tabs" }, undefined);
  /** The template whose bar IS a search field (`searchInline`). */
  const searchBar = resolveMobileChrome({ mobile: "search" }, undefined);

  it("returns the chrome untouched when every page is served", () => {
    const all = { search: true, accounts: true };
    expect(chromeWithPageControls(tabs, all)).toBe(tabs);
  });

  it("drops the search and account controls the shop no longer has", () => {
    const out = chromeWithPageControls(tabs, { search: false, accounts: false });
    expect(out.tabs).not.toContain("search");
    expect(out.tabs).not.toContain("account");
    expect([...out.left, ...out.right]).not.toContain("search");
    expect([...out.left, ...out.right]).not.toContain("account");
    // The rest of the merchant's chrome is untouched — this filters, it does
    // not re-template. Losing `home`/`cart` here would re-chrome the shop.
    expect(out.tabs).toContain("home");
    expect(out.tabs).toContain("cart");
  });

  it("keeps the account controls when only search is off", () => {
    const out = chromeWithPageControls(tabs, { search: false, accounts: true });
    expect(out.tabs).toContain("account");
    expect(out.tabs).not.toContain("search");
  });

  it("closes the search ROW rather than leaving an empty one", () => {
    // The two places search is a field rather than a glyph. An empty row (or a
    // bar still sized for an inline field) leaves a gap where the box was,
    // which reads as a broken header rather than a shop without search.
    const rowTemplate = tabs.row === "search" ? tabs : { ...tabs, row: "search" as const };
    expect(chromeWithPageControls(rowTemplate, { search: false, accounts: true }).row).toBe("none");
    expect(
      chromeWithPageControls({ ...searchBar, searchInline: true }, { search: false, accounts: true })
        .searchInline,
    ).toBe(false);
  });

  it("leaves a search row alone while search is served", () => {
    const rowTemplate = { ...tabs, row: "search" as const, searchInline: true };
    const out = chromeWithPageControls(rowTemplate, { search: true, accounts: false });
    expect(out.row).toBe("search");
    expect(out.searchInline).toBe(true);
  });
});
