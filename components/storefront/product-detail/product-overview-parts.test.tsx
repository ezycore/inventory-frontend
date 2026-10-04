// coding-standard: maintained

import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { I18N } from "@/lib/storefront-i18n";
import type { ProductBuy } from "./use-product-buy";
import type { ProductPart } from "@/lib/storefront-builder/product-parts";

/**
 * The column beside the photos, drawn part by part (`product-main`'s blocks).
 * The buying pieces are stubbed — they have their own behaviour and tests — so
 * what is asserted is the ORDER the column draws in and what each new part
 * draws, not the buy panel.
 */
vi.mock("@/components/storefront/product-gallery", () => ({ ProductGallery: () => null }));
vi.mock("@/services/storefront/use-orders-paused", () => ({ useOrdersPaused: () => null }));
vi.mock("@/components/storefront/product-detail/product-buy-panel", () => ({
  canChoose: () => true,
  ProductOptions: () => <div data-part="options" />,
  ProductQuantity: () => <div data-part="quantity" />,
  ProductBuyButtons: () => <div data-part="buy" />,
}));

const { ProductOverview } = await import("./product-overview");

const d = {
  t: I18N.en,
  base: "/shop",
  product: { _id: "p1", name: "Cotton cushion cover", slug: "cushion", description: "Soft cover.", tags: [] },
  images: [],
  imgIdx: 0,
  setImgIdx: () => {},
  soldOut: false,
  price: 650,
  currency: "BDT",
  hasOld: false,
  variable: true,
  variants: [{ _id: "v1" }],
} as unknown as ProductBuy;

const draw = (parts?: ProductPart[], promises?: { text: string }[]) =>
  render(<ProductOverview d={d} galleryTop={false} parts={parts} promises={promises} />).container;

/** The column's direct children, named by what each one is. */
function column(container: HTMLElement): string[] {
  const info = container.firstElementChild?.lastElementChild as HTMLElement;
  return [...info.children].map((child) => {
    if (child.tagName === "H1") return "name";
    if (child.tagName === "DETAILS") return "collapsible";
    const part = child.querySelector("[data-part]")?.getAttribute("data-part") ?? child.getAttribute("data-part");
    if (part) return part;
    if (child.textContent?.includes("In stock")) return "badges";
    if (child.textContent?.includes("650")) return "price";
    if (child.textContent?.includes("Soft cover.")) return "summary";
    if (child.classList.contains("sf-trust-list")) return "promises";
    return child.textContent ?? "?";
  });
}

describe("the product column", () => {
  it("draws the column as it always was with no parts", () => {
    expect(column(draw())).toEqual(["name", "badges", "price", "summary", "options", "quantity", "buy", expect.any(String)]);
  });

  it("draws the parts in the stored order", () => {
    const parts: ProductPart[] = [
      { key: "o", part: "options" },
      { key: "p", part: "price" },
      { key: "n", part: "name" },
      { key: "b", part: "buy" },
    ];
    expect(column(draw(parts))).toEqual(["options", "price", "name", "buy"]);
  });

  it("marks each buying part as the order bar's target", () => {
    const container = draw([{ key: "q", part: "quantity" }, { key: "b", part: "buy" }]);
    expect(container.querySelectorAll("[data-sf-buy-panel]")).toHaveLength(2);
  });

  it("leaves out the options of a product that has none — no empty target for the order bar", () => {
    const simple = { ...d, variable: false } as ProductBuy;
    const { container } = render(
      <ProductOverview d={simple} galleryTop={false} parts={[{ key: "o", part: "options" }, { key: "b", part: "buy" }]} />,
    );
    expect(container.querySelectorAll("[data-sf-buy-panel]")).toHaveLength(1);
    expect(container.querySelector("[data-part='options']")).toBeNull();
  });

  it("draws a collapsible part as a disclosure, open when asked", () => {
    const container = draw([
      { key: "c", part: "collapsible", title: "Size chart", text: "16 × 16 in", open: true },
      { key: "b", part: "buy" },
    ]);
    const fold = container.querySelector("details") as HTMLDetailsElement;
    expect(fold.querySelector("summary")?.textContent).toBe("Size chart");
    expect(fold.open).toBe(true);
    expect(fold.textContent).toContain("16 × 16 in");
  });

  it("draws nothing for an untitled collapsible part or empty text", () => {
    const container = draw([{ key: "c", part: "collapsible" }, { key: "t", part: "text" }, { key: "b", part: "buy" }]);
    expect(column(container)).toEqual(["buy"]);
  });

  it("draws the store's promises only when there are some", () => {
    const parts: ProductPart[] = [{ key: "pr", part: "promises" }, { key: "b", part: "buy" }];
    expect(column(draw(parts, [{ text: "Cash on delivery" }]))).toEqual(["promises", "buy"]);
    expect(column(draw(parts, []))).toEqual(["buy"]);
  });
});
