import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  HeroCard,
  HeroFullBleed,
} from "@/components/storefront/home/sections/hero-sections";
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

describe("HeroFullBleed", () => {
  const slides = [
    { title: "First", buttonLabel: "First CTA", link: "/shop" },
    { title: "Second", buttonLabel: "Second CTA", link: "/products" },
  ] as SectionProps["heroSlides"];

  it("normalizes the seeded /shop CTA against a tenant storefront base", () => {
    render(<HeroFullBleed {...props} heroSlides={slides} />);
    expect(screen.getByRole("link", { name: "First CTA" })).toHaveAttribute("href", "/shop");
  });

  it("preserves external slide links and opens them safely", () => {
    render(
      <HeroFullBleed
        {...props}
        heroSlides={[
          { ...slides![0], link: "https://example.com/babies" },
          slides![1],
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: "First CTA" })).toMatchObject({
      target: "_blank",
      rel: "noopener noreferrer",
    });
    expect(screen.getByRole("link", { name: "First CTA" })).toHaveAttribute(
      "href",
      "https://example.com/babies",
    );
  });

  it("names slide-picker dots as navigation controls", () => {
    render(<HeroFullBleed {...props} heroSlides={slides} />);
    expect(screen.getByRole("button", { name: "Go to slide 1" })).toBeInTheDocument();
  });
});
