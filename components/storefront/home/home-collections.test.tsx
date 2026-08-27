// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CatalogCategory } from "@/lib/storefront-client";
import { HomeCollections } from "@/components/storefront/home/home-collections";

/* The row reads the shop only for `theme.homeCollections`, and the preview
   store only when Customize is driving it. Both are stubbed so the test is
   about the one thing it is checking: whether the caption is drawn. */
vi.mock("@/services/storefront/store-context", () => ({
  useStoreContext: () => ({ slug: "rmc", base: "/shop" }),
}));
vi.mock("@/services/stores/use-sf-preview-store", () => ({
  useSfPreview: () => null,
}));
const store = vi.hoisted(() => ({ theme: {} as Record<string, unknown> }));
vi.mock("@/services/storefront/hooks", () => ({
  useStore: () => ({ data: store }),
}));

const category = (name: string, photographed: boolean): CatalogCategory =>
  ({
    _id: name,
    name,
    slug: name,
    slugPath: name,
    image: photographed ? { thumbnailUrl: `https://cdn.test/${name}.webp` } : null,
  }) as unknown as CatalogCategory;

const renderRow = (
  categories: CatalogCategory[],
  showLabels: boolean | undefined,
) => {
  store.theme = { homeCollections: { layout: "strip", showLabels } };
  return render(<HomeCollections base="/shop" categories={categories} />);
};

describe("HomeCollections pictures-only row", () => {
  const photographed = [category("Bakery", true), category("Drinks", true)];

  it("draws the name beside the picture by default", () => {
    renderRow(photographed, undefined);
    expect(screen.getByText("Bakery")).toBeInTheDocument();
  });

  it("takes the names off a fully photographed row", () => {
    renderRow(photographed, false);

    expect(screen.queryByText("Bakery")).not.toBeInTheDocument();
    // The picture still names the link, or a nameless tile would announce as
    // nothing at all in a screen reader's list of links.
    expect(screen.getByRole("link", { name: "Bakery" })).toBeInTheDocument();
    expect(screen.getByAltText("Bakery")).toBeInTheDocument();
  });

  /* The rule the merchant's catalogue actually hits: one un-photographed
     category renders as a letter tile, and a letter with no name under it is a
     mystery box where a department should be — so the whole row keeps its
     names rather than going ragged. */
  it("keeps every name when one category has no picture", () => {
    renderRow([...photographed, category("Pantry", false)], false);

    expect(screen.getByText("Bakery")).toBeInTheDocument();
    expect(screen.getByText("Pantry")).toBeInTheDocument();
  });
});
