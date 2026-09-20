// coding-standard: maintained
/**
 * **"Track order" must always reach tracking.**
 *
 * The link pointed at `/account` whenever the merchant had accounts switched on,
 * on the reasoning that a signed-in shopper's orders live there. That inverted
 * its own intent: accounts-on is exactly the configuration where the only link
 * named "Track order" stopped reaching tracking. A guest who lost the SMS link
 * met a sign-in wall on a store that takes guest orders, and `/orders/track` —
 * unauthenticated on purpose, and the whole point of the lost-link recovery
 * path — was reachable from nowhere else on the site. Found live on a shop in
 * production, where every internal href on the home page was scraped and the
 * lookup appeared in none of them.
 *
 * So the destination is pinned against BOTH account settings and both routing
 * bases: the bug was a branch that looked reasonable in isolation, and only the
 * combination it produced was wrong.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { UtilityBar, type HeaderCtx } from "@/components/storefront/header/header-shared";
import type { ResolvedUtilityBar } from "@/lib/storefront-utility-bar";

/** Only the fields `UtilityBar` reads; the rest of `HeaderCtx` is another
 *  component's contract and mocking it whole would pin nothing extra. */
const ctxFor = (over: Partial<HeaderCtx>): HeaderCtx =>
  ({
    base: "",
    phone: "8801900000000",
    showAccount: true,
    t: { trackOrder: "Track order" },
    ...over,
  }) as HeaderCtx;

const config: ResolvedUtilityBar = {
  enabled: true,
  showOnDesktop: true,
  showOnMobile: false,
  showPhone: true,
  showTrackOrder: true,
  // Off, so the test needs neither the theme store nor the locale router — this
  // is about one href.
  showLanguage: false,
  showTheme: false,
  trackOrderLabel: "",
};

const hrefFor = (over: Partial<HeaderCtx>) => {
  render(<UtilityBar ctx={ctxFor(over)} config={config} />);
  return screen.getByRole("link", { name: "Track order" }).getAttribute("href");
};

describe("UtilityBar — the track-order link", () => {
  it.each([true, false])(
    "reaches the lookup with accounts on/off (showAccount=%s)",
    (showAccount) => {
      expect(hrefFor({ showAccount })).toBe("/orders/track");
    },
  );

  it("carries the store's public base on a tenant subdomain", () => {
    // `storeHref` — the store lives under `/shop` here and at the root on a
    // custom domain, so a hardcoded path is wrong on one of the two.
    expect(hrefFor({ base: "/shop" })).toBe("/shop/orders/track");
  });

  it("never points at the account area", () => {
    // The regression in one line: signing in is `AccountLink`'s job, and it
    // renders in the same header.
    expect(hrefFor({ showAccount: true })).not.toContain("/account");
  });
});
