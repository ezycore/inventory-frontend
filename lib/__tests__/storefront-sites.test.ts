// coding-standard: maintained
import { describe, expect, it } from "vitest";
import {
  cachedPageSlug,
  isPageSlug,
  isSitesPath,
  publicPathname,
  siteOrigin,
  sitesPagePath,
} from "@/lib/storefront-sites";

const tenant = { slug: "rafi5", base: "/shop" };
const custom = { slug: "rafi5", base: "" };

describe("cachedPageSlug", () => {
  it("reads the page slug on a tenant subdomain and on a custom domain", () => {
    expect(cachedPageSlug(tenant, "/shop/pages/about")).toBe("about");
    expect(cachedPageSlug(custom, "/pages/eid-sale-2026")).toBe("eid-sale-2026");
  });

  it("leaves every other store path on the request-reading routes", () => {
    for (const path of ["/shop", "/shop/", "/shop/pages", "/shop/pages/", "/shop/products/x", "/shop/pages/a/b"]) {
      expect(cachedPageSlug(tenant, path)).toBeNull();
    }
    expect(cachedPageSlug(custom, "/")).toBeNull();
    expect(cachedPageSlug(custom, "/cart")).toBeNull();
  });

  it("never matches a tenant path outside the store base", () => {
    // `/pages/about` on a tenant subdomain belongs to the admin app.
    expect(cachedPageSlug(tenant, "/pages/about")).toBeNull();
    expect(cachedPageSlug(tenant, "/shopx/pages/about")).toBeNull();
    // A custom domain's stale `/shop` prefix is redirected, not cached.
    expect(cachedPageSlug(custom, "/shop/pages/about")).toBeNull();
  });

  it("keeps a slug outside the backend's grammar off the cache", () => {
    expect(cachedPageSlug(tenant, "/shop/pages/About")).toBeNull();
    expect(cachedPageSlug(tenant, "/shop/pages/about.x")).toBeNull();
    expect(cachedPageSlug(tenant, "/shop/pages/%E0%A6%95")).toBeNull();
  });
});

describe("sitesPagePath", () => {
  it("spells the internal path by mode", () => {
    expect(sitesPagePath(tenant, "about")).toBe("/sites/rafi5/shop/pages/about");
    expect(sitesPagePath(custom, "about")).toBe("/sites/rafi5/root/pages/about");
  });
});

describe("isPageSlug", () => {
  it("accepts exactly what normalizePageSlug writes", () => {
    expect(isPageSlug("summer-sale-2")).toBe(true);
    expect(isPageSlug("")).toBe(false);
    expect(isPageSlug("a.b")).toBe(false);
    expect(isPageSlug("A")).toBe(false);
  });
});

describe("isSitesPath", () => {
  it("matches the prefix as a whole segment only", () => {
    expect(isSitesPath("/sites")).toBe(true);
    expect(isSitesPath("/sites/rafi5/shop/pages/about")).toBe(true);
    expect(isSitesPath("/sitesx")).toBe(false);
    expect(isSitesPath("/shop/sites")).toBe(false);
  });
});

describe("publicPathname", () => {
  it("maps the internal spelling back to the address bar's", () => {
    expect(publicPathname("/sites/rafi5/shop/pages/about")).toBe("/shop/pages/about");
    expect(publicPathname("/sites/rafi5/root/pages/about")).toBe("/pages/about");
    expect(publicPathname("/sites/rafi5/root")).toBe("/");
  });

  it("returns every public pathname untouched", () => {
    for (const path of ["/shop/pages/about", "/pages/about", "/", "/sites", "/sites/phones", "/sites/a/b/c"]) {
      expect(publicPathname(path)).toBe(path);
    }
  });

  it("round-trips a rewrite", () => {
    for (const [store, path] of [
      [tenant, "/shop/pages/about"],
      [custom, "/pages/about"],
    ] as const) {
      expect(publicPathname(sitesPagePath(store, cachedPageSlug(store, path)!))).toBe(path);
    }
  });
});

describe("siteOrigin", () => {
  it("builds the tenant subdomain origin", () => {
    expect(siteOrigin("rafi5", "shop", "ezycore.com")).toBe("https://rafi5.ezycore.com");
    expect(siteOrigin("rafi5", "shop", "localhost:3000")).toBe("http://rafi5.localhost:3000");
  });

  it("claims no origin it cannot know", () => {
    expect(siteOrigin("rafi5", "root", "ezycore.com")).toBe("");
    expect(siteOrigin("rafi5", "shop", "")).toBe("");
    expect(siteOrigin("rafi5", "shop", undefined)).toBe("");
  });
});
