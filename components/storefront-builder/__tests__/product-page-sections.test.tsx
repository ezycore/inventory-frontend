// coding-standard: maintained
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CatalogProduct } from "@/lib/storefront-client";
import type { SectionContext } from "@/components/storefront-builder/section-view";
import {
  PageSections,
  prepareSections,
  sectionDataRequests,
  type PageSectionInstance,
} from "@/components/storefront-builder/page-sections";

vi.mock("@/components/storefront-builder/islands/island-map", () => ({
  Island: ({ name, props }: { name: string; props: unknown }) => (
    <div data-island={name} data-props={JSON.stringify(props)} />
  ),
}));

vi.mock("@/components/storefront/product/product-data", () => ({
  ProductFromRoute: ({ hideRelated }: { hideRelated?: boolean }) => (
    <div data-product-view data-hide-related={String(hideRelated)} />
  ),
}));

const PICKED = "0000000000000000000000aa";
const pageProduct = {
  _id: "0000000000000000000000bb",
  name: "Nakshi kantha",
  slug: "nakshi-kantha",
  categoryId: "0000000000000000000000cc",
} as CatalogProduct;

const section = (id: string, type: string, settings: unknown): PageSectionInstance => ({
  id,
  type,
  v: 1,
  enabled: true,
  settings,
});

const context = (overrides: Partial<SectionContext> = {}): SectionContext => ({
  base: "/shop",
  currency: "BDT",
  product: pageProduct,
  ...overrides,
});

const renderProductPage = (instances: PageSectionInstance[], ctx = context()) =>
  render(<PageSections sections={prepareSections(instances, "product")} context={ctx} data={{}} />);

const islandProps = (root: ParentNode, name: string) =>
  JSON.parse((root.querySelector(`[data-island="${name}"]`) as HTMLElement).dataset.props ?? "{}");

/**
 * Plan §17, Phase 6 step 6: Offer & pricing, Order form and Sticky order bar on
 * the product page sell the page's own product — no product is picked there,
 * and nothing is asked of the catalogue for it.
 */
describe("product add-ons on the product page", () => {
  const addOns = ["offer-pricing", "order-form", "sticky-order-bar"];

  it("draws each with the page's product and makes no product request", () => {
    const instances = addOns.map((type, i) => section(`s${i}`, type, {}));
    const prepared = prepareSections(instances, "product");
    expect(prepared.map((p) => p.id)).toEqual(["s0", "s1", "s2"]);
    expect(sectionDataRequests(prepared)).toEqual([]);

    const { container } = renderProductPage(instances);
    expect(islandProps(container, "offer-price").product).toEqual(pageProduct);
    expect(islandProps(container, "order-form").product).toEqual(pageProduct);
    expect(islandProps(container, "sticky-order-bar")).toEqual({
      product: pageProduct,
      currency: "BDT",
      onProductPage: true,
    });
  });

  it("ignores a product id on the product page rather than selling a second product", () => {
    const instances = [section("o1", "order-form", { productId: PICKED })];
    expect(sectionDataRequests(prepareSections(instances, "product"))).toEqual([]);
    const { container } = renderProductPage(instances);
    expect(islandProps(container, "order-form").product).toEqual(pageProduct);
  });

  it("is left out when the route resolved no product", () => {
    const instances = addOns.map((type, i) => section(`s${i}`, type, {}));
    const { container } = renderProductPage(instances, context({ product: undefined }));
    expect(container.querySelector("section")).toBeNull();
  });

  it("still needs a picked product where the page is not known to be the product page", () => {
    const instances = addOns.map((type, i) => section(`s${i}`, type, {}));
    expect(prepareSections(instances)).toEqual([]);
    expect(prepareSections(instances, "landing")).toEqual([]);
  });
});

/** Plan §17, Phase 6 step 5 (option B): the row can move out of the core section. */
describe("related products on the product page", () => {
  it("keeps the product view's own row unless the merchant hides it", () => {
    const shown = renderProductPage([section("main", "product-main", {})]);
    expect(shown.container.querySelector("[data-product-view]")?.getAttribute("data-hide-related")).toBe("false");
    shown.unmount();

    const hidden = renderProductPage([section("main", "product-main", { hideRelated: true })]);
    expect(hidden.container.querySelector("[data-product-view]")?.getAttribute("data-hide-related")).toBe("true");
  });

  it("hands the section's row the page's product, heading and number", () => {
    const { container } = renderProductPage([
      section("rel", "related-products", { heading: "Pairs well with", limit: 6 }),
    ]);
    expect(islandProps(container, "related-products")).toEqual({
      product: { slug: "nakshi-kantha", categoryId: "0000000000000000000000cc" },
      heading: "Pairs well with",
      limit: 6,
      currency: "BDT",
    });
  });

  it("hands the island its line, its columns AND its card photo", () => {
    // ⚠ The regression this exists for: `...CARD_PHOTO` was added to the SPEC —
    // so the editor offered Card photo shape and fit — and never spread into the
    // island's props, so a merchant set both and the cards ignored them. That is
    // the miss §0.4 of the plan names, made in the same change that added the
    // setting, and found only by comparing the rendered card against the core
    // section's beside it in a browser.
    const { container } = renderProductPage([
      section("rel", "related-products", {
        heading: "Pairs well with",
        subheading: "Chosen by hand.",
        limit: 6,
        columns: { base: 5, mobile: 2 },
        cardImageRatio: "portrait",
        cardImageFit: "fit",
      }),
    ]);
    expect(islandProps(container, "related-products")).toEqual({
      product: { slug: "nakshi-kantha", categoryId: "0000000000000000000000cc" },
      heading: "Pairs well with",
      subheading: "Chosen by hand.",
      limit: 6,
      columns: { base: 5, mobile: 2 },
      currency: "BDT",
      imageRatio: "3 / 4",
      imageFit: "canvas",
    });
  });

  it("draws nothing without the page's product", () => {
    const { container } = renderProductPage(
      [section("rel", "related-products", {})],
      context({ product: undefined }),
    );
    expect(container.querySelector("section")).toBeNull();
  });
});

/** A section limited to some products is drawn under those products only. */
describe("a section on some products only", () => {
  const RICH = JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Size guide" }] }] });
  const guide = (products: PageSectionInstance["visibility"]) => ({
    ...section("guide", "rich-text", { body: RICH }),
    visibility: products,
  });

  it("draws under a product in one of its categories", () => {
    const { container } = renderProductPage([guide({ products: { categories: [pageProduct.categoryId!] } })]);
    expect(container.textContent).toContain("Size guide");
  });

  it("draws nothing under any other product", () => {
    const { container } = renderProductPage([guide({ products: { categories: ["0000000000000000000000dd"] } })]);
    expect(container.querySelector("section")).toBeNull();
  });
});

/** The product's own description as a section of its own. */
describe("the description section", () => {
  const RICH = JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hand-stitched." }] }] });

  it("draws the page's product's description under the shop's own heading", () => {
    const { container } = renderProductPage(
      [section("d", "product-description", {})],
      context({ product: { ...pageProduct, description: RICH } }),
    );
    expect(container.textContent).toContain("Hand-stitched.");
    expect(islandProps(container, "store-word")).toEqual({ word: "description" });
  });

  it("takes the merchant's heading, or none", () => {
    const withDescription = context({ product: { ...pageProduct, description: RICH } });
    const typed = renderProductPage([section("d", "product-description", { heading: "About it" })], withDescription);
    expect(typed.container.querySelector("h2")?.textContent).toBe("About it");
    const hidden = renderProductPage([section("d", "product-description", { hideHeading: true })], withDescription);
    expect(hidden.container.querySelector("[data-island='store-word']")).toBeNull();
  });

  it("draws nothing for a product without a description", () => {
    const { container } = renderProductPage([section("d", "product-description", {})]);
    expect(container.querySelector("section")).toBeNull();
  });
});
