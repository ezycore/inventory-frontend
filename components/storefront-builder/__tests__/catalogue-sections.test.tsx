// coding-standard: maintained
import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CatalogCategory, CatalogProduct, StoreCampaign } from "@/lib/storefront-client";
import {
  PageSections,
  prepareSections,
  sectionDataRequests,
  sectionListNeeds,
  type PageSectionInstance,
} from "@/components/storefront-builder/page-sections";

vi.mock("@/components/storefront-builder/islands/island-map", () => ({
  Island: ({
    name,
    props,
  }: {
    name: string;
    props: { children?: ReactNode; products?: unknown[]; campaigns?: unknown[]; heading?: string };
  }) => (
    <div
      data-island={name}
      data-count={(props.products ?? props.campaigns)?.length}
      data-heading={props.heading}
    >
      {props.children}
    </div>
  ),
}));

const ID = (n: number) => n.toString(16).padStart(24, "0");

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

const campaigns = [
  { _id: "c1", name: "Eid sale", type: "percentage", value: 10, scope: "storewide" },
  { _id: "c2", name: "", type: "fixed", value: 50, scope: "storewide" },
] as StoreCampaign[];

const section = (
  id: string,
  type: string,
  settings: unknown,
  blocks?: unknown,
): PageSectionInstance => ({ id, type, v: 1, enabled: true, settings, blocks });

const renderPage = (instances: PageSectionInstance[], data = {}, extra = {}) =>
  render(
    <PageSections
      sections={prepareSections(instances)}
      context={{ base: "/shop", currency: "BDT", categories, campaigns, imageFit: "cover", ...extra }}
      data={data}
    />,
  );

const hrefs = (root: ParentNode) => [...root.querySelectorAll("a")].map((a) => a.getAttribute("href"));

describe("product-carousel", () => {
  const items = [{ _id: "p1" }, { _id: "p2" }, { _id: "p3" }] as CatalogProduct[];

  it("asks the catalogue for its source and hands the cards to the rail island", () => {
    const instance = section("r1", "product-carousel", {
      source: "newest",
      limit: 12,
      heading: "New in",
      ctaLabel: "All new",
      ctaHref: "/products?sort=newest",
    });
    expect(sectionDataRequests(prepareSections([instance]))).toEqual([
      { key: "r1", type: "products", source: "newest", limit: 12, inStock: true },
    ]);
    const { container } = renderPage([instance], { r1: { items } });
    const island = container.querySelector("[data-island]") as HTMLElement;
    expect(island.dataset.island).toBe("product-rail");
    expect(island.dataset.count).toBe("3");
    expect(container.textContent).toContain("New in");
    expect(hrefs(container)).toEqual(["/shop/products?sort=newest"]);
  });
});

describe("campaign-offers", () => {
  it("reads the running campaigns, and only when it is on the page", () => {
    const instance = section("o1", "campaign-offers", { heading: "This week" });
    expect(sectionListNeeds(prepareSections([instance]))).toEqual(["campaigns"]);
    const { container } = renderPage([instance]);
    const island = container.querySelector("[data-island]") as HTMLElement;
    expect(island.dataset.island).toBe("campaign-offers");
    expect(island.dataset.count).toBe("1");
    expect(island.dataset.heading).toBe("This week");
  });

  it("is left out when no campaign is running", () => {
    const { container } = renderPage([section("o1", "campaign-offers", {})], {}, { campaigns: [] });
    expect(container.querySelectorAll("section")).toHaveLength(0);
  });
});

describe("category-tiles", () => {
  it("draws a grid of every top-level collection by default", () => {
    const { container } = renderPage([section("t1", "category-tiles", { heading: "Departments" })]);
    const grid = container.querySelector(".sf-cat-tiles") as HTMLElement;
    expect(hrefs(grid)).toEqual(["/shop/phones", "/shop/audio"]);
    expect(container.textContent).toContain("Departments");
  });

  it("hands a strip to the category-strip island, picked sub-collections included", () => {
    const { container } = renderPage([
      section("t1", "category-tiles", { layout: "strip", mode: "disc", categoryIds: [ID(11), ID(12)] }),
    ]);
    const island = container.querySelector('[data-island="category-strip"]') as HTMLElement;
    expect(hrefs(island)).toEqual(["/shop/phones/cases", "/shop/audio"]);
  });
});

describe("category-promo-cards", () => {
  it("draws one card per block with its own words, skipping a missing collection", () => {
    const { container } = renderPage([
      section("pc1", "category-promo-cards", { heading: "Shop the season", shape: { base: "split", mobile: "stacked" } }, [
        { id: "c1", settings: { categoryId: ID(12), title: "Audio week", buttonLabel: "Listen" } },
        { id: "c2", settings: { categoryId: ID(99) } },
        { id: "c3", settings: { categoryId: ID(10) } },
      ]),
    ]);
    const cards = [...container.querySelectorAll(".sf-banner-card")] as HTMLElement[];
    expect(cards.map((card) => card.getAttribute("href"))).toEqual(["/shop/audio", "/shop/phones"]);
    expect(cards[0].textContent).toContain("Audio week");
    expect(cards[0].textContent).toContain("Listen");
    expect(cards[1].textContent).toBe("Phones");
    expect(cards[0].className).toContain("sf-banner-card--split-d");
    expect(cards[0].className).not.toContain("sf-banner-card--split-m");
  });

  it("scrolls through the category-strip island when a screen asks for a track", () => {
    const { container } = renderPage([
      section("pc1", "category-promo-cards", { flow: { base: "wrap", mobile: "scroll" } }, [
        { id: "c1", settings: { categoryId: ID(12) } },
      ]),
    ]);
    const island = container.querySelector('[data-island="category-strip"]') as HTMLElement;
    expect(island.querySelectorAll(".sf-banner-card")).toHaveLength(1);
  });

  it("is left out when none of its collections exist", () => {
    const { container } = renderPage([
      section("pc1", "category-promo-cards", {}, [{ id: "c1", settings: { categoryId: ID(99) } }]),
    ]);
    expect(container.querySelectorAll("section")).toHaveLength(0);
  });
});
