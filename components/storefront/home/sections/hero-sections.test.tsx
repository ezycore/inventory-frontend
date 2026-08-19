import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroCard } from "@/components/storefront/home/sections/hero-sections";
import type { SectionProps } from "@/components/storefront/home/home-shared";

const props = {
  base: "/shop",
  featured: [],
  latest: [],
  categories: [],
  campaigns: [],
  t: {
    shopNow: "Shop now",
  },
  store: { name: "My Store", trustBadges: [] },
} as SectionProps;

describe("HeroCard", () => {
  it("uses merchant identity without inventing a sale or promise", () => {
    render(<HeroCard {...props} />);

    expect(screen.getByRole("heading", { level: 1, name: "My Store" })).toBeInTheDocument();
    expect(screen.queryByText(/sale|discount|authentic|delivery/i)).not.toBeInTheDocument();
  });

  it("renders a promise only when the merchant supplied it", () => {
    render(
      <HeroCard
        {...props}
        store={{ ...props.store, trustBadges: [{ text: "Pickup available" }] }}
      />,
    );

    expect(screen.getByText("Pickup available")).toBeInTheDocument();
  });
});
