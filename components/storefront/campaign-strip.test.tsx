// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StoreCampaign, StoreCampaignStrip } from "@/lib/storefront-client";
import { CampaignStrip } from "@/components/storefront/campaign-strip";

/* The strip reads three sources. Campaigns and the pathname are what the tests
   drive; the preview store is inert outside Customize. (It used to read the
   category and tag lists too, to turn a campaign's first target id into a public
   URL — the campaign's own page replaced all of that.) */
const state = vi.hoisted(() => ({
  campaigns: [] as StoreCampaign[],
  pathname: "/shop",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => state.pathname,
}));
vi.mock("@/services/storefront/hooks", () => ({
  useStoreCampaigns: () => ({ data: state.campaigns }),
}));
vi.mock("@/services/stores/use-sf-preview-store", () => ({
  useSfPreview: (select: (s: Record<string, unknown>) => unknown) =>
    select({ campaignStrip: undefined, active: false }),
}));

const live: StoreCampaign = {
  _id: "c1",
  slug: "mega-sale",
  name: "Mega Sale",
  type: "percentage",
  value: 20,
  scope: "storewide",
};

const renderStrip = (config?: StoreCampaignStrip, pathname = "/shop") => {
  state.pathname = pathname;
  return render(
    <CampaignStrip slug="rmc" base="/shop" config={config} />,
  );
};

const strip = () => document.querySelector("[data-sf-campaign-strip]");

beforeEach(() => {
  state.campaigns = [live];
  state.pathname = "/shop";
  localStorage.clear();
});

describe("CampaignStrip — the campaign's schedule outranks every setting", () => {
  /* This is the invariant the settings must never be able to break. The backend
     serves only campaigns whose start/end window contains now, so an empty list
     IS "the sale is over" — and no combination of presentation settings may
     put an expired campaign back on the storefront. */
  it("renders nothing once no campaign is live, however the strip is configured", () => {
    state.campaigns = [];
    renderStrip({
      enabled: true,
      showOn: "all",
      showOnDesktop: true,
      showOnMobile: true,
      dismissible: false,
    });
    expect(strip()).toBeNull();
    expect(screen.queryByText("Mega Sale")).not.toBeInTheDocument();
  });

  it("still renders a live campaign when the merchant has never opened the editor", () => {
    renderStrip(undefined);
    expect(screen.getByText("Mega Sale")).toBeInTheDocument();
  });

  it("lets the merchant hide a running campaign", () => {
    renderStrip({ enabled: false });
    expect(strip()).toBeNull();
  });
});

describe("CampaignStrip page scope", () => {
  it("shows on a non-home page by default", () => {
    renderStrip(undefined, "/shop/products");
    expect(screen.getByText("Mega Sale")).toBeInTheDocument();
  });

  it("hides off the home page when scoped to home", () => {
    renderStrip({ showOn: "home" }, "/shop/products");
    expect(strip()).toBeNull();
  });

  it("still shows on the home page when scoped to home", () => {
    renderStrip({ showOn: "home" }, "/shop");
    expect(screen.getByText("Mega Sale")).toBeInTheDocument();
  });

  it("treats a trailing slash as the home page", () => {
    // `pageOf` normalises the base prefix; a shopper landing on "/shop/" must
    // not lose a home-scoped strip.
    renderStrip({ showOn: "home" }, "/shop/");
    expect(screen.getByText("Mega Sale")).toBeInTheDocument();
  });
});

describe("CampaignStrip presentation", () => {
  it("carries no visibility class when it shows on both breakpoints", () => {
    renderStrip({ showOnDesktop: true, showOnMobile: true });
    expect(strip()?.className).toBe("sf-noprint");
  });

  it("hides on mobile via the storefront's own responsive class", () => {
    renderStrip({ showOnDesktop: true, showOnMobile: false });
    expect(strip()).toHaveClass("sf-desktop-only");
  });

  it("hides on desktop via the storefront's own responsive class", () => {
    renderStrip({ showOnDesktop: false, showOnMobile: true });
    expect(strip()).toHaveClass("sf-mobile-only");
  });

  it("marks a strip switched off on both breakpoints", () => {
    renderStrip({ showOnDesktop: false, showOnMobile: false });
    expect(strip()).toHaveClass("sf-strip-hidden");
  });

  it("applies the merchant's colours inline", () => {
    renderStrip({ bgColor: "#123456", textColor: "#ffffff" });
    const el = strip() as HTMLElement;
    expect(el.style.background).toBe("rgb(18, 52, 86)");
    expect(el.style.color).toBe("rgb(255, 255, 255)");
  });

  it("hands size and spacing to the stylesheet as attributes", () => {
    /* Not as pixels. The tokens are redefined per breakpoint in
       storefront.css, and an inline value outranks every media query — which
       is how the strip wore a 1440px screen's spacing on a 375px phone. */
    renderStrip({ size: "lg", paddingY: "lg", paddingX: "sm" });
    const el = strip() as HTMLElement;
    expect(el).toHaveAttribute("data-sf-strip", "campaign");
    expect(el).toHaveAttribute("data-strip-size", "lg");
    expect(el).toHaveAttribute("data-strip-pad-y", "lg");
    expect(el).toHaveAttribute("data-strip-pad-x", "sm");

    const link = el.querySelector("a") as HTMLElement;
    expect(link.style.fontSize).toBe("var(--strip-font)");
    expect(link.style.paddingBlock).toBe("var(--strip-pad-y)");
    expect(link.style.paddingInline).toBe("var(--strip-pad-x)");
    // No frozen pixel on the three properties that must scale. `gap` stays a
    // literal on purpose — 9px between two words costs the same on any screen.
    expect(link.getAttribute("style")).not.toMatch(
      /(font-size|padding-block|padding-inline):[^;]*\d+px/,
    );
  });

  it("clears the dismiss button with a floor, not a fixed inset", () => {
    renderStrip({ dismissible: true, paddingX: "sm" });
    const link = strip()!.querySelector("a") as HTMLElement;
    expect(link.style.paddingInline).toBe(
      "max(var(--strip-pad-x), var(--strip-dismiss-pad))",
    );
  });

  it("has no dismiss button unless the merchant asked for one", () => {
    renderStrip({ dismissible: false });
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("keeps the dismiss button outside the link", () => {
    // A <button> nested in an <a> is invalid HTML and the browser's fix-up
    // leaves the dismiss click navigating instead of closing.
    renderStrip({ dismissible: true });
    const button = screen.getByRole("button");
    expect(button.closest("a")).toBeNull();
  });

  /* A campaign can be scheduled years out, and the strip used to print day and
     month only — so a sale ending in a later year read as one ending within
     weeks. The rule itself is `campaignEndsLabel`'s and tested there; this is
     the wiring, so the strip cannot quietly go back to formatting its own. */
  it("shows the year when the campaign ends in a different one", () => {
    const nextYear = new Date().getFullYear() + 2;
    state.campaigns = [{ ...live, endsAt: `${nextYear}-06-15T12:00:00.000Z` }];
    renderStrip();
    expect(strip()).toHaveTextContent(String(nextYear));
  });

  it("leaves the year off a campaign ending this year", () => {
    const thisYear = new Date().getFullYear();
    state.campaigns = [{ ...live, endsAt: `${thisYear}-12-15T12:00:00.000Z` }];
    renderStrip();
    expect(strip()).not.toHaveTextContent(String(thisYear));
  });

  /* The label is the end instant on the SHOPPER's clock, which the server (UTC)
     cannot know. Rendered there, it would disagree with the hydrating browser on
     every page view outside UTC — so the server HTML carries the campaign but no
     label, and the browser adds it after hydration. */
  it("prints the end date and time on the client, joined as one phrase", () => {
    state.campaigns = [{ ...live, endsAt: "2026-12-15T12:00:00.000Z" }];
    renderStrip();
    expect(strip()).toHaveTextContent(/Ends (Dec 15|15 Dec)(, \d{4})? at \d{1,2}:\d{2}\s(AM|PM)/);
  });

  it("leaves the label out of the server-rendered HTML", () => {
    state.campaigns = [{ ...live, endsAt: "2026-12-15T12:00:00.000Z" }];
    const html = renderToString(<CampaignStrip slug="rmc" base="/shop" />);
    expect(html).toContain("Mega Sale");
    expect(html).not.toContain("Ends");
  });
});

describe("CampaignStrip — where the CTA goes", () => {
  const cta = () => strip()?.querySelector("a");

  it("links to the campaign's own page, for every scope", () => {
    // Before that page existed this resolved the first target id against the
    // live facet lists and fell back to /products for anything it could not
    // name — which was every product-scoped and every storewide campaign. A
    // shopper told "20% off" was handed the whole catalogue to search.
    state.campaigns = [{ ...live, scope: "product", targets: ["p1", "p2"] }];
    renderStrip();
    expect(cta()).toHaveAttribute("href", "/shop/campaigns/mega-sale");
  });

  it("falls back to the catalogue only for a campaign with no slug yet", () => {
    state.campaigns = [{ ...live, slug: null }];
    renderStrip();
    expect(cta()).toHaveAttribute("href", "/shop/products");
  });
});
