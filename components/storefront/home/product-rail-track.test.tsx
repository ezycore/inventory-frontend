// coding-standard: maintained
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CatalogProduct } from "@/lib/storefront-client";
import { ProductRailTrack } from "@/components/storefront/home/product-rail-track";

vi.mock("@/components/storefront/product-card", () => ({
  ProductCard: ({ product }: { product: CatalogProduct }) => <div data-card={product._id} />,
}));

vi.mock("@/components/storefront/home/category-strip", () => ({
  CategoryStrip: ({ trackClassName, children }: { trackClassName?: string; children: React.ReactNode }) => (
    <div data-strip="" data-track-class={trackClassName}>
      {children}
    </div>
  ),
}));

const products = [
  { _id: "a", name: "A", slug: "a" },
  { _id: "b", name: "B", slug: "b" },
] as CatalogProduct[];

describe("ProductRailTrack", () => {
  it("keeps its own bare track when no arrows are asked for", () => {
    // ⚠ A carousel with no arrows asked for passes nothing, so this branch is
    // its markup — asserted as the ABSENCE of the strip, not as the cards
    // merely appearing.
    const { container } = render(<ProductRailTrack products={products} currency="BDT" />);
    expect(container.querySelector("[data-strip]")).toBeNull();
    const track = container.firstElementChild as HTMLElement;
    expect(track.style.display).toBe("grid");
    expect(track.style.gridAutoFlow).toBe("column");
    expect(container.querySelectorAll("[data-card]")).toHaveLength(2);
  });

  it("hands the strip its track when a merchant asks for arrows", () => {
    const { container } = render(<ProductRailTrack products={products} currency="BDT" arrows />);
    const strip = container.querySelector("[data-strip]") as HTMLElement;
    expect(strip).not.toBeNull();
    // The grid moves to the stylesheet, which is why the class has to be passed.
    expect(strip.dataset.trackClass).toBe("sf-rail-track");
    expect(container.querySelectorAll("[data-card]")).toHaveLength(2);
  });
});
