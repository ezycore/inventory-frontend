/**
 * `canonicalRedirectFor` is the only thing standing between "one indexable site"
 * and "the same catalogue served on three hosts". It is also the piece with the
 * worst failure mode in the request path — a wrong 301 is cached by the browser
 * and points a live store somewhere it does not own — so every branch is pinned
 * here rather than discovered by curling production.
 */
import { describe, expect, it } from "vitest";
import { canonicalRedirectFor } from "./storefront-canonical-redirect";

const subdomain = {
  method: "GET",
  host: "uriibaba.ezycore.com",
  base: "/shop" as const,
};
const customDomain = {
  method: "GET",
  host: "uriibaba.com",
  base: "" as const,
};

describe("canonicalRedirectFor", () => {
  describe("tenant subdomain", () => {
    it("sends a store path to the custom domain and drops /shop", () => {
      expect(
        canonicalRedirectFor({
          ...subdomain,
          pathname: "/shop/products/red-shirt",
          canonicalHost: "uriibaba.com",
        }),
      ).toEqual({ host: "uriibaba.com", path: "/products/red-shirt" });
    });

    it("maps the bare /shop to the custom domain root", () => {
      expect(
        canonicalRedirectFor({
          ...subdomain,
          pathname: "/shop",
          canonicalHost: "uriibaba.com",
        }),
      ).toEqual({ host: "uriibaba.com", path: "/" });
    });

    it("collection paths keep their shape", () => {
      expect(
        canonicalRedirectFor({
          ...subdomain,
          pathname: "/shop/phones/accessories",
          canonicalHost: "uriibaba.com",
        }),
      ).toEqual({ host: "uriibaba.com", path: "/phones/accessories" });
    });

    // The regression that would take every subdomain-only store offline: strip
    // `/shop` with nowhere to send it and the shopper lands on the admin app.
    it("does NOTHING when the store has no custom domain", () => {
      expect(
        canonicalRedirectFor({
          ...subdomain,
          pathname: "/shop/products/red-shirt",
          canonicalHost: null,
        }),
      ).toBeNull();
      expect(
        canonicalRedirectFor({
          ...subdomain,
          pathname: "/shop",
          canonicalHost: null,
        }),
      ).toBeNull();
    });
  });

  describe("custom domain", () => {
    it("does nothing when the serving host is already canonical", () => {
      expect(
        canonicalRedirectFor({
          ...customDomain,
          pathname: "/products/red-shirt",
          canonicalHost: "uriibaba.com",
        }),
      ).toBeNull();
    });

    it("collapses an alias host onto the canonical one, path intact", () => {
      expect(
        canonicalRedirectFor({
          ...customDomain,
          host: "www.uriibaba.com",
          pathname: "/phones",
          canonicalHost: "uriibaba.com",
        }),
      ).toEqual({ host: "uriibaba.com", path: "/phones" });
    });

    // Pre-existing behaviour, preserved: `/shop` is the internal namespace and
    // must never surface on a domain whose root is the store.
    it("strips a stale /shop prefix on the same host", () => {
      expect(
        canonicalRedirectFor({
          ...customDomain,
          pathname: "/shop/products/red-shirt",
          canonicalHost: null,
        }),
      ).toEqual({ host: "uriibaba.com", path: "/products/red-shirt" });
    });

    it("strips /shop and moves host in one hop, not two", () => {
      expect(
        canonicalRedirectFor({
          ...customDomain,
          host: "www.uriibaba.com",
          pathname: "/shop/phones",
          canonicalHost: "uriibaba.com",
        }),
      ).toEqual({ host: "uriibaba.com", path: "/phones" });
    });
  });

  describe("safety", () => {
    // Same host in and out is the loop condition — the one bug that makes a
    // store unreachable rather than merely mis-ranked.
    it("never returns the host it was given with the path it was given", () => {
      const cases = [
        { ...customDomain, pathname: "/", canonicalHost: "uriibaba.com" },
        { ...customDomain, pathname: "/phones", canonicalHost: null },
        { ...subdomain, pathname: "/shop", canonicalHost: null },
      ];
      for (const input of cases) {
        const out = canonicalRedirectFor(input);
        expect(out === null || out.host !== input.host || out.path !== input.pathname).toBe(true);
      }
    });

    it("leaves non-GET/HEAD methods alone", () => {
      for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
        expect(
          canonicalRedirectFor({
            ...subdomain,
            method,
            pathname: "/shop/cart",
            canonicalHost: "uriibaba.com",
          }),
        ).toBeNull();
      }
    });

    it("treats HEAD like GET", () => {
      expect(
        canonicalRedirectFor({
          ...subdomain,
          method: "head",
          pathname: "/shop",
          canonicalHost: "uriibaba.com",
        }),
      ).toEqual({ host: "uriibaba.com", path: "/" });
    });
  });
});
