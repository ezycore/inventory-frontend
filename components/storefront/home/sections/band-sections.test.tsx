import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
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

describe("editorial split — QA-123 (must not repeat the hero's copy)", () => {
  const heroBanner = {
    title: "New collection, delivered to your door",
    subtitle: "Saree, three piece, panjabi and everyday fashion.",
    primaryLabel: "Shop now",
  };
  const t = {
    editorialTitle: "Worth a closer look",
    editorialSubtitle: "A few of our favourites, picked for you.",
    shopNow: "Shop now",
  };

  it("renders its OWN headline/subtitle, not the hero's, even when both are on the page", () => {
    render(<EditorialSplit {...props} t={t as SectionProps["t"]} heroBanner={heroBanner} />);
    expect(screen.getByText("Worth a closer look")).toBeInTheDocument();
    expect(screen.getByText("A few of our favourites, picked for you.")).toBeInTheDocument();
    expect(screen.queryByText(heroBanner.title)).not.toBeInTheDocument();
    expect(screen.queryByText(heroBanner.subtitle)).not.toBeInTheDocument();
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
          campaignEndsAt: "Ends {date} at {time}",
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

describe("offer card end time", () => {
  const dealT = {
    campaignOffers: "Current offers",
    campaignOff: "off",
    campaignEndsAt: "Ends {date} at {time}",
    previousOffer: "Previous offer",
    nextOffer: "Next offer",
    langCode: "en-BD",
  } as SectionProps["t"];
  const campaigns = [
    { _id: "one", name: "Flash sale", endsAt: "2026-12-15T12:00:00.000Z" },
  ] as SectionProps["campaigns"];

  it("prints the end instant as one phrase in the browser", () => {
    render(<DealStrip {...props} campaigns={campaigns} t={dealT} />);
    expect(screen.getByText(/^Ends (Dec 15|15 Dec)(, \d{4})? at \d{1,2}:\d{2}\s(AM|PM)$/)).toBeInTheDocument();
  });

  /* Printed in the shopper's zone, which the UTC server cannot know — so the
     server HTML has the offer but not the label (no hydration mismatch). */
  it("leaves the label out of the server-rendered HTML", () => {
    const html = renderToString(<DealStrip {...props} campaigns={campaigns} t={dealT} />);
    expect(html).toContain("Flash sale");
    expect(html).not.toContain("Ends");
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
