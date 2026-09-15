// coding-standard: maintained
import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CatalogCategory, CatalogProduct, StoreTag } from "@/lib/storefront-client";
import {
  PageSections,
  prepareSections,
  sectionDataRequests,
  sectionListNeeds,
  type PageSectionInstance,
} from "@/components/storefront-builder/page-sections";

vi.mock("@/components/storefront-builder/islands/island-map", () => ({
  Island: ({ name, props }: { name: string; props: { children?: ReactNode; word?: string } }) => (
    <div data-island={name} data-word={props.word}>
      {props.children}
    </div>
  ),
}));

const ID = (n: number) => n.toString(16).padStart(24, "0");

const tags = [
  { _id: ID(1), name: "Newborn", slug: "newborn", productCount: 3 },
  { _id: ID(2), name: "0-3M", slug: "0-3m", productCount: 2 },
] as StoreTag[];

const categories = [
  {
    _id: ID(10),
    name: "Phones",
    slug: "phones",
    slugPath: "phones",
    children: [{ _id: ID(11), name: "Cases", slug: "cases", slugPath: "phones/cases" }],
  },
  { _id: ID(12), name: "Audio", slug: "audio", slugPath: "audio" },
] as CatalogCategory[];

const section = (
  id: string,
  type: string,
  settings: unknown,
  blocks?: unknown,
): PageSectionInstance => ({ id, type, v: 1, enabled: true, settings, blocks });

const renderPage = (instances: PageSectionInstance[], data = {}) =>
  render(
    <PageSections
      sections={prepareSections(instances)}
      context={{ base: "/shop", currency: "BDT", categories, tags, imageFit: "cover", imageRatio: "1 / 1" }}
      data={data}
    />,
  );

const hrefs = (root: ParentNode) => [...root.querySelectorAll("a")].map((a) => a.getAttribute("href"));

describe("home frames", () => {
  const frameOf = (instance: PageSectionInstance) => prepareSections([instance])[0]?.frame;

  it("spaces a home section as the home page does until its style box says otherwise", () => {
    expect(frameOf(section("g1", "product-grid", { source: "featured", limit: 8 }))?.style).toMatchObject({
      "--sfb-pt": "22px",
      "--sfb-pb": "22px",
    });
    expect(frameOf(section("r1", "product-carousel", { source: "newest", limit: 8 }))?.style).toMatchObject({
      "--sfb-bg": "var(--surface)",
    });
    expect(
      frameOf({ ...section("r2", "product-carousel", { source: "newest", limit: 8 }), style: { padding: { base: { top: "lg", bottom: "lg" } } } })
        ?.style,
    ).toMatchObject({ "--sfb-pt": "clamp(40px, 6vw, 64px)" });
    // A section the home page never had keeps the common frame.
    expect(frameOf(section("f1", "faq", {}, [{ id: "q", settings: { question: "Q?", answer: "A." } }]))?.style)
      .toMatchObject({ "--sfb-pt": "clamp(24px, 4vw, 40px)" });
  });

  it("frames the hero by its layout and slide count", () => {
    const slide = (id: string) => ({ id, settings: { title: "Eid sale" } });
    expect(frameOf(section("h1", "hero", { layout: "open" }, [slide("a")]))?.style).toMatchObject({
      "--sfb-pt": "clamp(28px,5vw,64px)",
    });
    expect(frameOf(section("h2", "hero", { layout: "open" }, [slide("a"), slide("b")]))?.style).toMatchObject({
      "--sfb-pt": "var(--pad)",
    });
    expect(frameOf(section("h3", "hero", { layout: "full-bleed" }, [slide("a")]))?.width).toBe("full");
  });
});

describe("store-wide lists", () => {
  it("asks for each list once, and only when a section on the page reads it", () => {
    const needs = sectionListNeeds(
      prepareSections([
        section("t1", "shop-by-tag", { tagIds: [ID(1)] }),
        section("c1", "collections-row", {}),
        section("t2", "shop-by-tag", { tagIds: [ID(2)] }),
      ]),
    );
    expect(needs).toEqual(["tags", "categories"]);
    expect(sectionListNeeds(prepareSections([section("p1", "promises-band", {}, [])]))).toEqual([]);
  });
});

describe("promises-band", () => {
  it("draws the merchant's promises and leaves out a band with none", () => {
    const { container } = renderPage([
      section("p1", "promises-band", { heading: "Why us" }, [
        { id: "b1", settings: { text: "Cash on delivery", icon: "truck" } },
        { id: "b2", settings: { text: "Easy returns" } },
      ]),
      section("p2", "promises-band", {}, []),
    ]);
    expect(container.querySelectorAll("section")).toHaveLength(1);
    expect(container.querySelectorAll(".sf-trust-row")).toHaveLength(2);
    expect(container.textContent).toContain("Cash on delivery");
  });

  it("draws the store's own promises under storePromises, and nothing when the store has none", () => {
    const store = section("p1", "promises-band", { storePromises: true }, []);
    const drawn = render(
      <PageSections
        sections={prepareSections([store])}
        context={{ base: "/shop", trustBadges: [{ text: "Genuine products", icon: "shield" }] }}
        data={{}}
      />,
    );
    expect(drawn.container.querySelectorAll(".sf-trust-row")).toHaveLength(1);
    expect(drawn.container.textContent).toContain("Genuine products");
    expect(renderPage([store]).container.querySelectorAll("section")).toHaveLength(0);
  });
});

describe("shop-by-tag", () => {
  it("links picked tags in pick order and drops a deleted one", () => {
    const { container } = renderPage([
      section("t1", "shop-by-tag", { tagIds: [ID(2), ID(99), ID(1)] }),
      section("t2", "shop-by-tag", { tagIds: [ID(99)] }),
    ]);
    expect(container.querySelectorAll("section")).toHaveLength(1);
    expect(hrefs(container)).toEqual(["/shop/products?tags=0-3m", "/shop/products?tags=newborn"]);
  });

  it("keeps the classic row's heading under storeHeading: the merchant's, else Shop by age", () => {
    const { container } = renderPage([
      section("t1", "shop-by-tag", { tagIds: [ID(1)], storeHeading: "shopByAge" }),
      section("t2", "shop-by-tag", { tagIds: [ID(2)], storeHeading: "shopByAge", heading: "By size" }),
    ]);
    const [word, own] = container.querySelectorAll("h2");
    expect(word.querySelector('[data-word="shopByAge"]')).not.toBeNull();
    expect(own.textContent).toBe("By size");
  });
});

describe("collections-row", () => {
  it("lists every top-level collection when none are picked", () => {
    const { container } = renderPage([section("c1", "collections-row", { layout: "grid", columns: 5 })]);
    const grid = container.querySelector(".sf-home-collections") as HTMLElement;
    expect(grid.style.getPropertyValue("--sf-hc-cols")).toBe("5");
    expect(hrefs(grid)).toEqual(["/shop/phones", "/shop/audio"]);
  });

  it("draws picked collections, sub-collections included, in pick order", () => {
    const { container } = renderPage([
      section("c1", "collections-row", { layout: "grid", categoryIds: [ID(11), ID(12)] }),
    ]);
    expect(hrefs(container)).toEqual(["/shop/phones/cases", "/shop/audio"]);
  });

  it("hands a strip to the category-strip island and draws the plain style as text links", () => {
    const { container } = renderPage([
      section("c1", "collections-row", {}),
      section("c2", "collections-row", { style: "plain" }),
    ]);
    const [strip, plain] = container.querySelectorAll("section");
    expect(strip.querySelector("[data-island]")?.getAttribute("data-island")).toBe("category-strip");
    expect(strip.querySelectorAll(".sf-chip-letter")).toHaveLength(2);
    expect(hrefs(plain)).toEqual(["/shop/phones", "/shop/audio"]);
    expect(plain.querySelector(".sf-chip-letter")).toBeNull();
  });

  it("is left out when none of its collections exist any more", () => {
    const { container } = renderPage([section("c1", "collections-row", { categoryIds: [ID(99)] })]);
    expect(container.querySelectorAll("section")).toHaveLength(0);
  });
});

describe("selected-products", () => {
  const items = [{ _id: ID(5), name: "Kurta", slug: "kurta", price: 1200, images: [] }] as unknown as CatalogProduct[];

  it("asks the catalogue for its source, keeping hand-picked products", () => {
    const prepared = prepareSections([
      section("s1", "selected-products", { source: "manual", productIds: [ID(5)], limit: 6 }),
      section("s2", "selected-products", { source: "category", limit: 4 }),
    ]);
    expect(sectionDataRequests(prepared)).toEqual([
      { key: "s1", type: "products", source: "manual", limit: 6, productIds: [ID(5)] },
    ]);
  });

  it("draws the link beside its heading only with both a label and a destination", () => {
    const { container } = renderPage(
      [
        section("s1", "selected-products", { source: "featured", limit: 4, heading: "Our picks", ctaLabel: "See all" }),
        section("s2", "selected-products", { source: "featured", limit: 4, ctaLabel: "See all", ctaHref: "/products" }),
      ],
      { s1: { items }, s2: { items } },
    );
    const [withoutLink, withLink] = container.querySelectorAll("section");
    expect(hrefs(withoutLink)).toEqual(["/shop/products/kurta"]);
    expect(withoutLink.textContent).toContain("Our picks");
    expect(hrefs(withLink)).toEqual(["/shop/products", "/shop/products/kurta"]);
  });
});

describe("image-text", () => {
  const image = { url: "https://cdn.example.com/a.jpg", mediumUrl: "https://cdn.example.com/a-md.jpg" };

  it("is skipped without its photo", () => {
    expect(prepareSections([section("i1", "image-text", { heading: "Our story" })])).toEqual([]);
  });

  it("draws only complete buttons, opening another site in a new tab", () => {
    const { container } = renderPage([
      section("i1", "image-text", {
        image,
        heading: "Made by hand",
        imageSide: "right",
        buttonLabel: "Shop",
        buttonHref: "/products",
        secondaryLabel: "Find us",
        secondaryHref: "https://maps.example.com",
      }),
      section("i2", "image-text", { image, heading: "No buttons", buttonLabel: "Half filled" }),
    ]);
    const [full, bare] = container.querySelectorAll("section");
    expect(full.querySelector(".sfb-split")?.getAttribute("data-image-side")).toBe("right");
    expect(full.querySelector("img")).not.toBeNull();
    expect(hrefs(full)).toEqual(["/shop/products", "https://maps.example.com"]);
    expect(full.querySelectorAll("a")[1].getAttribute("target")).toBe("_blank");
    expect(bare.querySelectorAll("a")).toHaveLength(0);
  });
});
