/**
 * `canonicalTarget` decides which host every absolute storefront URL points at.
 * The custom-domain branch is hard to exercise in local QA (it needs a verified,
 * active domain), so it is pinned here instead.
 */
import { describe, expect, it } from "vitest";
import { canonicalTarget } from "./storefront-canonical";
import type { StorefrontStore } from "@/lib/storefront-client";

const store = (canonicalHost: string | null | undefined) =>
  ({ canonicalHost }) as StorefrontStore;

const subdomainRequest = { origin: "https://rmc41.ezycore.com", base: "/shop" };

describe("canonicalTarget", () => {
  it("falls back to the serving host when the store has no custom domain", () => {
    expect(canonicalTarget(store(null), subdomainRequest)).toEqual(subdomainRequest);
    expect(canonicalTarget(store(undefined), subdomainRequest)).toEqual(subdomainRequest);
    expect(canonicalTarget(null, subdomainRequest)).toEqual(subdomainRequest);
  });

  // The whole point: the same page served on the subdomain must claim the custom
  // domain, or the shop is indexed twice and the ranking signal splits.
  it("points at the custom domain even when served from the tenant subdomain", () => {
    expect(canonicalTarget(store("acme.com"), subdomainRequest)).toEqual({
      origin: "https://acme.com",
      base: "",
    });
  });

  // A custom domain serves the shop at the ROOT — carrying `/shop` over from the
  // request would canonicalize every page to a URL that 404s on that host.
  it("drops the /shop base for a custom domain", () => {
    const { base } = canonicalTarget(store("acme.com"), subdomainRequest);
    expect(base).toBe("");
  });

  it("is idempotent when already served from the canonical host", () => {
    expect(
      canonicalTarget(store("acme.com"), { origin: "https://acme.com", base: "" }),
    ).toEqual({ origin: "https://acme.com", base: "" });
  });

  it("always uses https — a domain only goes active once its cert is issued", () => {
    expect(
      canonicalTarget(store("acme.com"), { origin: "http://acme.com", base: "" }).origin,
    ).toBe("https://acme.com");
  });

  it("treats a blank canonicalHost as absent rather than building https://", () => {
    expect(canonicalTarget(store("   "), subdomainRequest)).toEqual(subdomainRequest);
  });
});
