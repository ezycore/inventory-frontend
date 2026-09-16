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

  it("draws nothing without the page's product", () => {
    const { container } = renderProductPage(
      [section("rel", "related-products", {})],
      context({ product: undefined }),
    );
    expect(container.querySelector("section")).toBeNull();
  });
});
