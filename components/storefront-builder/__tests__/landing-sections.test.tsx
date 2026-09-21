// coding-standard: maintained
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CatalogProduct } from "@/lib/storefront-client";
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

const PRODUCT_ID = "0000000000000000000000aa";
const product = { _id: PRODUCT_ID, name: "Jamdani saree", slug: "jamdani" } as CatalogProduct;

const section = (id: string, type: string, settings: unknown): PageSectionInstance => ({
  id,
  type,
  v: 1,
  enabled: true,
  settings,
});

const renderPage = (instances: PageSectionInstance[], data: Record<string, { items: CatalogProduct[] }>) =>
  render(
    <PageSections
      sections={prepareSections(instances)}
      context={{ base: "/shop", currency: "BDT" }}
      data={data}
    />,
  );

const islandProps = (root: ParentNode, name: string) =>
  JSON.parse((root.querySelector(`[data-island="${name}"]`) as HTMLElement).dataset.props ?? "{}");

describe("landing page product sections", () => {
  const types = ["order-form", "single-product", "offer-pricing", "sticky-order-bar"];

  it("each asks for its one product by id", () => {
    const instances = types.map((type, i) => section(`s${i}`, type, { productId: PRODUCT_ID }));
    expect(sectionDataRequests(prepareSections(instances))).toEqual(
      types.map((_, i) => ({
        key: `s${i}`,
        type: "products",
        source: "manual",
        productIds: [PRODUCT_ID],
        limit: 1,
      })),
    );
  });

  it("is left out entirely when its product is gone", () => {
    const instances = types.map((type, i) => section(`s${i}`, type, { productId: PRODUCT_ID }));
    const { container } = renderPage(instances, {});
    expect(container.querySelector("section")).toBeNull();
  });

  it("is not drawn without a product picked", () => {
    const instances = types.map((type, i) => section(`s${i}`, type, {}));
    expect(prepareSections(instances)).toEqual([]);
  });
});

describe("single-product", () => {
  it("hands the product and its photo layout to the island", () => {
    const { container } = renderPage(
      [section("p1", "single-product", { productId: PRODUCT_ID, galleryLayout: "gallery-top" })],
      { p1: { items: [product] } },
    );
    expect(islandProps(container, "single-product")).toEqual({
      product,
      galleryLayout: "gallery-top",
      hideDescription: false,
    });
  });
});

describe("offer-pricing", () => {
  it("draws the merchant's words above the price island", () => {
    const { container } = renderPage(
      [section("o1", "offer-pricing", { productId: PRODUCT_ID, heading: "Eid offer", text: "Two days only" })],
      { o1: { items: [product] } },
    );
    expect(container.querySelector("h2")?.textContent).toBe("Eid offer");
    expect(container.textContent).toContain("Two days only");
    expect(islandProps(container, "offer-price")).toEqual({ product, currency: "BDT" });
  });
});

describe("sticky-order-bar", () => {
  it("floats: its frame is marked so it takes no room in the page", () => {
    const { container } = renderPage(
      [
        section("b1", "sticky-order-bar", { productId: PRODUCT_ID, buttonLabel: "Order now" }),
        section("f1", "order-form", { productId: PRODUCT_ID }),
      ],
      { b1: { items: [product] }, f1: { items: [product] } },
    );
    const [bar, form] = container.querySelectorAll("section");
    expect(bar.hasAttribute("data-float")).toBe(true);
    expect(form.hasAttribute("data-float")).toBe(false);
    expect(islandProps(container, "sticky-order-bar")).toEqual({
      product,
      currency: "BDT",
      buttonLabel: "Order now",
      onProductPage: false,
    });
  });

  it("finds the order form by the anchor the form section carries", () => {
    const { container } = renderPage([section("f1", "order-form", { productId: PRODUCT_ID })], {
      f1: { items: [product] },
    });
    expect(container.querySelector("[data-sf-order-form]")).not.toBeNull();
  });
});
