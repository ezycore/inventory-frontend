import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  DealStrip,
  EditorialSplit,
  TrustBand,
} from "@/components/storefront/home/sections/band-sections";
import type { SectionProps } from "@/components/storefront/home/home-shared";

const props = {
  base: "/shop",
  featured: [],
  latest: [],
  categories: [],
  campaigns: [],
  t: {},
  store: {
    name: "Pharmacy",
    trustBadges: [
      { text: "Genuine medicine", icon: "shield" },
      { text: "Cash on delivery", icon: "coins" },
      { text: "Cash on delivery", icon: "truck" },
      { text: "Expiry checked", icon: "check" },
    ],
  },
} as SectionProps;

describe("merchant promise sections", () => {
  it("renders all four promises, including duplicate wording", () => {
    const { container } = render(<TrustBand {...props} />);
    expect(container.querySelectorAll(".sf-trust-row")).toHaveLength(4);
    expect(screen.getAllByText("Cash on delivery")).toHaveLength(2);
  });

  it("renders nothing when the merchant has not supplied promises", () => {
    const { container } = render(
      <TrustBand {...props} store={{ ...props.store, trustBadges: [] }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("offer position", () => {
  it("is mobile-only because desktop already shows every offer", () => {
    render(
      <DealStrip
        {...props}
        campaigns={[
          { _id: "one", name: "First offer" },
          { _id: "two", name: "Second offer" },
          { _id: "three", name: "Third offer" },
        ] as SectionProps["campaigns"]}
        t={{
          campaignOffers: "Current offers",
          campaignOff: "off",
          campaignEnds: "Ends",
          previousOffer: "Previous offer",
          nextOffer: "Next offer",
        } as SectionProps["t"]}
      />,
    );

    expect(screen.getByText("1 / 3")).toHaveClass("sf-deals-position");

    const css = readFileSync(
      resolve(process.cwd(), "app/(storefront)/storefront.css"),
      "utf8",
    );
    expect(css).toMatch(/\.sf-deals-position\s*{[^}]*display:\s*none;/);
    expect(css).toMatch(
      /@media \(max-width: 640px\)\s*{\s*\.sf-deals-position\s*{\s*display:\s*inline;/,
    );
  });
});

describe("EditorialSplit", () => {
  it("uses mobile artwork as the desktop fallback when it is the only banner", () => {
    const { container } = render(
      <EditorialSplit
        {...props}
        heroBanner={{ mobileImage: { url: "/mobile-banner.jpg" } }}
      />,
    );

    expect(container.querySelector('img[src="/mobile-banner.jpg"]')).toBeInTheDocument();
  });
});
