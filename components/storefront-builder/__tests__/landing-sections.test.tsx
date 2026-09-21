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

/* ---- Phases 5 and 6 ---- */

describe("the media and conversion sections' new controls", () => {
  const banner = { url: "https://cdn.example.com/b.jpg" };

  it("splits the banner's one alignment into three, and unset draws the old pair", () => {
    const { container } = renderPage([
      section("b1", "image-banner", { image: banner, heading: "Eid sale" }),
      section("b2", "image-banner", {
        image: banner,
        heading: "Eid sale",
        align: { base: "right" },
        verticalAlign: { base: "middle" },
        scrim: 50,
      }),
    ], {});
    const [plain, shaped] = [...container.querySelectorAll(".sfb-banner-copy")] as HTMLElement[];
    // ⚠ Unset: one attribute with its old value and NOTHING else, so the two
    // stylesheet blocks that drew left-bottom-gradient and centre-middle-wash
    // still decide. The absence is what keeps a live banner where it was.
    expect(plain.dataset.align).toBe("left");
    expect(plain.dataset.valign).toBeUndefined();
    expect(plain.hasAttribute("data-scrim")).toBe(false);

    expect(shaped.dataset.align).toBe("right");
    expect(shaped.dataset.valign).toBe("middle");
    expect(shaped.hasAttribute("data-scrim")).toBe(true);
    expect((shaped.closest(".sfb-banner") as HTMLElement).style.getPropertyValue("--sfb-banner-scrim")).toBe("50%");
  });

  it("lets the sticky bar stand on a desktop, and says nothing when it does not", () => {
    const { container } = renderPage(
      [
        section("s1", "sticky-order-bar", { productId: PRODUCT_ID }),
        section("s2", "sticky-order-bar", { productId: PRODUCT_ID, screens: "phones-and-computers" }),
      ],
      { s1: { items: [product] }, s2: { items: [product] } },
    );
    const props = [...container.querySelectorAll("[data-island]")].map((el) =>
      JSON.parse((el as HTMLElement).dataset.props ?? "{}"),
    );
    expect(props[0].screens).toBeUndefined();
    expect(props[1].screens).toBe("phones-and-computers");
  });

  it("gives the order form's button the merchant's words", () => {
    const { container } = renderPage(
      [section("o1", "order-form", { productId: PRODUCT_ID, buttonLabel: "Order now" })],
      { o1: { items: [product] } },
    );
    const props = JSON.parse((container.querySelector("[data-island]") as HTMLElement).dataset.props ?? "{}");
    expect(props.buttonLabel).toBe("Order now");
  });

  it("asks the catalogue for the merchant's order — but never on a hand-picked row", () => {
    const requests = sectionDataRequests(
      prepareSections([
        section("g1", "product-grid", { source: "newest", limit: 8, sort: "price-low" }),
        // ⚠ `manual` IS an order: the one the merchant dragged the products into.
        section("g2", "product-grid", { source: "manual", limit: 8, productIds: [PRODUCT_ID], sort: "price-low" }),
      ]),
    );
    expect(requests[0].sort).toBe("price-low");
    expect(requests[1].sort).toBeUndefined();
  });
});
