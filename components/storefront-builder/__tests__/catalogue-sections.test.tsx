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
    props: {
      children?: ReactNode;
      products?: unknown[];
      campaigns?: unknown[];
      heading?: string;
      headingWord?: string;
      word?: string;
      wholeRows?: boolean;
      arrows?: boolean;
    };
  }) => (
    <div
      data-island={name}
      data-count={(props.products ?? props.campaigns)?.length}
      data-heading={props.heading}
      data-heading-word={props.headingWord}
      data-word={props.word}
      data-whole-rows={props.wholeRows === undefined ? undefined : String(props.wholeRows)}
      data-arrows={props.arrows === undefined ? undefined : String(props.arrows)}
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

/** The same two collections, photographed and described. */
const photographed = [
  {
    ...categories[0],
    description: "Every handset we carry",
    image: { url: "https://cdn.test/phones.webp" },
  },
  {
    ...categories[1],
    description: "Speakers and headphones",
    image: { url: "https://cdn.test/audio.webp" },
  },
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

  it("puts the cards in view on a variable and the arrows on a prop", () => {
    // ⚠ Two different mechanisms on purpose. `perView` is a NUMBER the rail's
    // track already divides itself by, so it rides `--cols` and needs no prop;
    // `arrows` is BEHAVIOUR and has to reach the island itself, which is the
    // miss §0.4 of the plan names.
    const instance = section("r1", "product-carousel", {
      source: "newest",
      limit: 12,
      heading: "New in",
      perView: { base: 4, mobile: 2 },
      arrows: true,
    });
    const { container } = renderPage([instance], { r1: { items } });
    const wrapper = container.querySelector('[style*="--cols"]') as HTMLElement;
    expect(wrapper.style.getPropertyValue("--cols")).toBe("4");
    expect(wrapper.style.getPropertyValue("--cols-m")).toBe("2");
    expect((wrapper.querySelector("[data-island]") as HTMLElement).dataset.arrows).toBe("true");
  });

  it("asks for no arrows when the merchant did not", () => {
    const instance = section("r1", "product-carousel", { source: "newest", limit: 12, heading: "New in" });
    const { container } = renderPage([instance], { r1: { items } });
    const island = container.querySelector("[data-island]") as HTMLElement;
    expect(island.dataset.arrows).toBe("false");
  });
});

describe("product rows that keep the store's wording", () => {
  const items = [{ _id: "p1" }, { _id: "p2" }] as CatalogProduct[];
  const cards = (root: ParentNode) => root.querySelector('[data-island="product-cards"]') as HTMLElement;

  it("names a grid in the shopper's language, links View all to the catalogue and trims to full rows", () => {
    const instance = section("g1", "product-grid", {
      source: "featured",
      limit: 8,
      storeHeading: "featured",
      viewAll: true,
      wholeRows: true,
    });
    expect(sectionListNeeds(prepareSections([instance]))).toEqual([]);
    const { container } = renderPage([instance], { g1: { items } });
    expect(container.querySelector('h2 [data-word="featured"]')).not.toBeNull();
    expect(container.querySelector('a [data-word="viewAll"]')).not.toBeNull();
    expect(hrefs(container)).toEqual(["/shop/products"]);
    expect(cards(container).dataset.wholeRows).toBe("true");
  });

  it("names a collection row after its collection and links to it", () => {
    const instance = section("g2", "product-grid", {
      source: "category",
      categoryId: ID(11),
      limit: 8,
      storeHeading: "collection",
      viewAll: true,
      ctaLabel: "Every case",
    });
    expect(sectionListNeeds(prepareSections([instance]))).toEqual(["categories"]);
    const { container } = renderPage([instance], { g2: { items } });
    expect(container.querySelector("h2")?.textContent).toBe("Cases");
    expect(container.querySelector("a")?.textContent).toBe("Every case →");
    expect(hrefs(container)).toEqual(["/shop/phones/cases"]);
  });

  it("keeps every pick of a hand-picked row, and a new row shows only the merchant's words", () => {
    const instance = section("g3", "product-grid", {
      source: "manual",
      productIds: [ID(20), ID(21)],
      limit: 2,
      wholeRows: true,
      heading: "Our picks",
      ctaLabel: "More",
    });
    const { container } = renderPage([instance], { g3: { items } });
    expect(cards(container).dataset.wholeRows).toBe("false");
    expect(container.querySelector("[data-word]")).toBeNull();
    expect(container.querySelector("h2")?.textContent).toBe("Our picks");
    expect(hrefs(container)).toEqual([]);
  });

  it("gives selected products the home page's narrow column and heading row", () => {
    const { container } = renderPage(
      [section("s1", "selected-products", { source: "featured", limit: 6, storeHeading: "selected" })],
      { s1: { items } },
    );
    expect(container.querySelector('h2 [data-word="selected"]')).not.toBeNull();
    // The column is declared as a variable rather than an inline `max-width`
    // since 2026-09-21, so `.sfb-own-column` can stand aside for a merchant who
    // picks a width on the Style tab. The number itself is unchanged.
    const column = container.querySelector(".sfb-inner > div") as HTMLElement;
    expect(column.className).toBe("sfb-own-column");
    expect(column.getAttribute("style")).toContain("--sfb-own-column: calc(980px - 2 * var(--pad))");
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

  it("names the row Current offers in the shopper's language only when the merchant gave no heading", () => {
    const { container } = renderPage([
      section("o1", "campaign-offers", { storeHeading: "campaignOffers" }),
      section("o2", "campaign-offers", { storeHeading: "campaignOffers", heading: "Eid deals" }),
    ]);
    const [word, own] = container.querySelectorAll('[data-island="campaign-offers"]') as NodeListOf<HTMLElement>;
    expect(word.dataset.headingWord).toBe("campaignOffers");
    expect(own.dataset.headingWord).toBeUndefined();
    expect(own.dataset.heading).toBe("Eid deals");
  });

  it("treats a heading of spaces as no heading, so the store's wording survives", () => {
    /* Untrimmed, a heading of spaces counted as the merchant's: it suppressed
       `headingWord` AND drew an empty `<h2>`, so the row lost its title to a
       field that looks empty in the editor. Every sibling that offers this pair
       trims (`ShopByTagSection`); this one now does too. */
    const { container } = renderPage([
      section("o1", "campaign-offers", { storeHeading: "campaignOffers", heading: "   " }),
    ]);
    const island = container.querySelector('[data-island="campaign-offers"]') as HTMLElement;
    expect(island.dataset.headingWord).toBe("campaignOffers");
    expect(island.dataset.heading).toBeUndefined();
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

  /* A photographed, described catalogue — the only one where the tile's photo
     box exists at all. Without pictures the row falls to its compact lettered
     shape, which reserves no slot for a shape or a corner to apply to. */
  const shot = { categories: photographed };

  it("gives the photo box the shape the merchant picked, per screen", () => {
    const { container } = renderPage(
      [section("t1", "category-tiles", { tileRatio: { base: "16:9", mobile: "1:1" } })],
      {},
      shot,
    );
    const wrap = container.querySelector('[style*="--sfb-tile-ratio"]') as HTMLElement;
    expect(wrap.style.getPropertyValue("--sfb-tile-ratio")).toBe("16 / 9");
    expect(wrap.style.getPropertyValue("--sfb-tile-ratio-m")).toBe("1 / 1");
    /* ⚠ The regression this pair guards: the variable was emitted and the tile
       drew a literal `1 / 1`, so every shape but Square was inert. The box has
       to READ it, with its own mode's shape as the fallback. */
    const photo = container.querySelector(".sf-media-cover") as HTMLElement;
    expect(photo.style.aspectRatio).toBe("var(--sfb-tile-ratio, 1 / 1)");
  });

  it("leaves the shape variable unset, and the tile square, when nobody asked", () => {
    const { container } = renderPage([section("t1", "category-tiles", {})], {}, shot);
    const wrap = container.querySelector(".sf-cat-tiles")?.parentElement as HTMLElement;
    expect(wrap.style.getPropertyValue("--sfb-tile-ratio")).toBe("");
    expect(wrap.style.getPropertyValue("--sfb-tile-radius")).toBe("");
  });

  it("rounds every box of the tile from one corner setting", () => {
    const { container } = renderPage([section("t1", "category-tiles", { radius: 0 })], {}, shot);
    const wrap = container.querySelector(".sf-cat-tiles")?.parentElement as HTMLElement;
    expect(wrap.style.getPropertyValue("--sfb-tile-radius")).toBe("0px");
    const card = container.querySelector(".sf-cat-tiles > a") as HTMLElement;
    expect(card.style.borderRadius).toBe("var(--sfb-tile-radius, var(--radius-lg))");
    const photo = container.querySelector(".sf-media-cover") as HTMLElement;
    expect(photo.style.borderRadius).toBe("var(--sfb-tile-radius, var(--radius-md))");
  });

  it("lets a tile's name and sentence follow the section's tone, tint card included", () => {
    /* Browser QA, 2026-09-25: a `tile` card is `--primary-soft`, a 13% TINT —
       it composites over the band rather than grounding the text, so the
       theme's dark ink on it went unreadable the moment a merchant set a dark
       background. Only an OPAQUE ground (`--card`: the tag chips, the promo
       cards, the benefit cards) keeps the theme's colours. */
    const { container } = renderPage([section("t1", "category-tiles", { mode: "tile" })], {}, shot);
    const card = container.querySelector(".sf-cat-tiles > a") as HTMLElement;
    expect(card.style.background).toBe("var(--primary-soft)");
    const [name, sentence] = [...card.querySelectorAll("span > span")] as HTMLElement[];
    expect(name.style.color).toBe("inherit");
    expect(sentence.style.color).toBe("var(--sfb-muted, var(--muted))");
  });

  it("draws the collection's own sentence, and drops it when asked", () => {
    const { container } = renderPage([section("t1", "category-tiles", {})], {}, shot);
    expect(container.textContent).toContain("Every handset we carry");

    const hidden = renderPage(
      [section("t1", "category-tiles", { hideDescription: true })],
      {},
      shot,
    );
    expect(hidden.container.textContent).toContain("Phones");
    expect(hidden.container.textContent).not.toContain("Every handset we carry");
  });

  it("lets a fully photographed round row drop its captions", () => {
    const { container } = renderPage(
      [section("t1", "category-tiles", { mode: "circle", showLabels: false })],
      {},
      shot,
    );
    const tiles = [...container.querySelectorAll(".sf-cat-tiles > a")];
    expect(tiles.map((t) => t.textContent)).toEqual(["", ""]);
    // The picture is the whole tile, so the link carries the name for a reader.
    expect(tiles.map((t) => t.getAttribute("aria-label"))).toEqual(["Phones", "Audio"]);
  });

  it("keeps a round row's names while any collection has no picture", () => {
    /* `categoryLabelsVisible`: pictures-only needs EVERY listed collection
       photographed, or the unphotographed ones become unexplained initials.
       The rule the editor cannot enforce, because it cannot see the store. */
    const { container } = renderPage(
      [section("t1", "category-tiles", { mode: "circle", showLabels: false })],
      {},
      { categories: [photographed[0], categories[1]] as CatalogCategory[] },
    );
    expect(container.textContent).toContain("Phones");
    expect(container.textContent).toContain("Audio");
  });

  it("passes the arrow switch to the strip, and nothing when unset", () => {
    const off = renderPage(
      [section("t1", "category-tiles", { layout: "strip", arrows: false })],
      {},
      shot,
    );
    expect(
      off.container.querySelector('[data-island="category-strip"]')?.getAttribute("data-arrows"),
    ).toBe("false");

    // Unset stays unset, so `CategoryStrip`'s own `arrows = true` decides.
    const plain = renderPage([section("t1", "category-tiles", { layout: "strip" })], {}, shot);
    expect(
      plain.container.querySelector('[data-island="category-strip"]')?.getAttribute("data-arrows"),
    ).toBeNull();
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

  it("gives every card a Shop now button under storeWords, keeping a card's own label", () => {
    const { container } = renderPage([
      section("pc1", "category-promo-cards", { storeWords: true }, [
        { id: "c1", settings: { categoryId: ID(12) } },
        { id: "c2", settings: { categoryId: ID(10), buttonLabel: "See phones" } },
      ]),
    ]);
    const cards = [...container.querySelectorAll(".sf-banner-card")] as HTMLElement[];
    expect(cards[0].querySelector('[data-word="shopNow"]')).not.toBeNull();
    expect(cards[1].textContent).toContain("See phones");
    expect(cards[1].querySelector("[data-word]")).toBeNull();
  });

  it("is left out when none of its collections exist", () => {
    const { container } = renderPage([
      section("pc1", "category-promo-cards", {}, [{ id: "c1", settings: { categoryId: ID(99) } }]),
    ]);
    expect(container.querySelectorAll("section")).toHaveLength(0);
  });
});
