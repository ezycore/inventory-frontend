import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrustBand } from "@/components/storefront/home/sections/band-sections";
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
