import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditorialSplit, TrustBand } from "@/components/storefront/home/sections/band-sections";
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
