import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EditorialSplit } from "@/components/storefront/home/sections/band-sections";
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
  heroBanner: {
    title: "Everything, by seven.",
    subtitle: "A considered selection.",
  },
  store: { name: "Muslin" },
} as SectionProps;

describe("EditorialSplit", () => {
  it("renders its visible headline as the primary heading when selected", () => {
    render(<EditorialSplit {...props} primaryHeading />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Everything, by seven." }),
    ).toBeInTheDocument();
  });

  it("stays a secondary heading when another section owns the h1", () => {
    render(<EditorialSplit {...props} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Everything, by seven." }),
    ).toBeInTheDocument();
  });

  it("uses the store name without inventing editorial copy", () => {
    render(<EditorialSplit {...props} heroBanner={undefined} primaryHeading />);

    expect(screen.getByRole("heading", { level: 1, name: "Muslin" })).toBeInTheDocument();
    expect(screen.queryByText("Everything, by seven.")).not.toBeInTheDocument();
    expect(screen.queryByText("A considered selection.")).not.toBeInTheDocument();
  });
});
