// coding-standard: maintained
import { describe, expect, it } from "vitest";
import {
  cachedPageSlug,
  isPageSlug,
  isSitesPath,
  isStoreHomePath,
  publicPathname,
  siteOrigin,
  sitesHomePath,
  sitesPagePath,
  sitesPreviewPath,
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

describe("sitesPreviewPath", () => {
  it("puts owner preview beside the cached page, under /sites", () => {
    expect(sitesPreviewPath(tenant, "about")).toBe("/sites/rafi5/shop/preview/about");
    expect(sitesPreviewPath(custom, "about")).toBe("/sites/rafi5/root/preview/about");
    // So the proxy's block on direct `/sites` requests covers it too.
    expect(isSitesPath(sitesPreviewPath(tenant, "about"))).toBe(true);
  });
});

describe("isStoreHomePath", () => {
  it("matches the store's front door on each kind of host", () => {
    expect(isStoreHomePath(tenant, "/shop")).toBe(true);
    expect(isStoreHomePath(tenant, "/shop/")).toBe(true);
    expect(isStoreHomePath(custom, "/")).toBe(true);
  });

  it("matches nothing else", () => {
    for (const path of ["/", "/shopx", "/shop/pages/home", "/shop/products"]) {
      expect(isStoreHomePath(tenant, path)).toBe(false);
    }
    for (const path of ["/shop", "/pages/home"]) {
      expect(isStoreHomePath(custom, path)).toBe(false);
    }
  });
});

describe("sitesHomePath", () => {
  it("puts both home routes beside the page routes, under /sites", () => {
    expect(sitesHomePath(tenant)).toBe("/sites/rafi5/shop/home");
    expect(sitesHomePath(custom, { preview: true })).toBe("/sites/rafi5/root/preview-home");
    expect(isSitesPath(sitesHomePath(tenant, { preview: true }))).toBe(true);
  });

  it("maps back to the front door the browser asked for", () => {
    expect(publicPathname(sitesHomePath(tenant))).toBe("/shop");
    expect(publicPathname(sitesHomePath(tenant, { preview: true }))).toBe("/shop");
    expect(publicPathname(sitesHomePath(custom))).toBe("/");
    // A landing page whose own address is `/pages/home` is not the home route.
    expect(publicPathname(sitesPagePath(tenant, "home"))).toBe("/shop/pages/home");
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

  it("maps the owner-preview route back to the page the browser asked for", () => {
    expect(publicPathname("/sites/rafi5/shop/preview/about")).toBe("/shop/pages/about");
    expect(publicPathname("/sites/rafi5/root/preview/about")).toBe("/pages/about");
  });

  it("round-trips a rewrite, cached or previewed", () => {
    for (const [store, path] of [
      [tenant, "/shop/pages/about"],
      [custom, "/pages/about"],
    ] as const) {
      const pageSlug = cachedPageSlug(store, path)!;
      expect(publicPathname(sitesPagePath(store, pageSlug))).toBe(path);
      expect(publicPathname(sitesPreviewPath(store, pageSlug))).toBe(path);
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
