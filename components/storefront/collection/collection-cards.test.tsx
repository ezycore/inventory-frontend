// coding-standard: maintained

import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { I18N } from "@/lib/storefront-i18n";
import type { CollectionCards, CollectionHeader } from "./collection-page";

/**
 * What the `collection-grid` section's card settings do to the collection page.
 *
 * The rule under test is the precedence: **`layout` still picks the grid, and
 * `columns` only changes the count it reads.** Switching the class instead would
 * take the filter rail off a sidebar page, and would move a phone-only answer's
 * desktop from three cards to four — the screen the merchant did not touch.
 *
 * ⚠ As on the product page: a class asserted here is not a rendering asserted
 * here. jsdom loads no stylesheet. The browser pass is what proves `--colcols3`
 * beats `.sf-grid-3`'s own count.
 */
vi.mock("@/services/storefront/store-context", () => ({
  useStoreContext: () => ({ slug: "rmc", base: "/shop" }),
}));
vi.mock("@/services/storefront/ui-context", () => ({ useStorefrontUI: () => ({ t: I18N.en }) }));
vi.mock("@/services/storefront/hooks", () => ({
  useStore: () => ({ data: undefined }),
  useStoreProducts: () => ({ data: { items: [{ _id: "p1", name: "Kantha", slug: "kantha" }] }, isLoading: false }),
  useStoreProductsInfinite: () => ({ data: undefined, isLoading: false }),
}));
vi.mock("@/services/stores/use-sf-preview-store", () => ({
  useStoreTemplate: (_store: unknown, key: string, own?: string) =>
    key === "pagination" ? (own ?? "pages") : (own ?? "grid4"),
  useSfPreview: () => undefined,
}));
vi.mock("@/components/storefront/use-catalog-facets", () => ({
  useCatalogFacets: () => ({
    filterKey: "k",
    setParams: () => {},
    chips: [],
    clearAll: () => {},
    sort: "featured",
    page: 1,
    setPage: () => {},
    params: {},
    categories: [],
    data: { brands: [], tags: [], options: [], categories: [] },
    filters: {},
    currency: "BDT",
  }),
}));
vi.mock("@/components/storefront/product-card", () => ({
  ProductCard: ({ imageFit, imageRatio }: { imageFit?: string; imageRatio?: string }) => (
    <div data-testid="card" data-fit={String(imageFit)} data-ratio={String(imageRatio)} />
  ),
}));
// The filter chrome is its own component with its own tests; here it only has
// to hand the grid through.
vi.mock("@/components/storefront/filters/catalog-filters", () => ({
  CatalogFilters: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/storefront/use-store-filters", async () => {
  const { DEFAULT_FILTER_SETTINGS } = await import("@/lib/storefront-filters");
  return { useStoreFilters: () => DEFAULT_FILTER_SETTINGS };
});
vi.mock("@/components/storefront/subcategory-strip", () => ({
  SubcategoryStrip: () => null,
  stripParent: () => undefined,
  subcategoriesFor: () => [],
}));
vi.mock("@/components/storefront/pager", () => ({ Pager: () => null }));
vi.mock("@/components/storefront/load-more", () => ({ LoadMore: () => null }));

const { CollectionPageView } = await import("./collection-page");

const draw = (cards?: CollectionCards, layout?: string) => {
  const { container } = render(<CollectionPageView cards={cards} layout={layout} />);
  const card = container.querySelector("[data-testid='card']") as HTMLElement;
  return { row: card.parentElement as HTMLElement, card };
};

const drawHeader = (header?: CollectionHeader, collection?: { name: string }) => {
  const { container } = render(
    <CollectionPageView header={header} collection={collection as never} />,
  );
  return {
    h1: container.querySelector("h1"),
    text: container.textContent ?? "",
    line: container.querySelector("h1 + p"),
  };
};

describe("the collection page's own card count", () => {
  it("keeps each layout's grid when the merchant set no count", () => {
    expect(draw().row.className).toBe("sf-grid-4");
    expect(draw(undefined, "grid3").row.className).toBe("sf-grid-3");
    expect(draw(undefined, "sidebar").row.className).toBe("sf-grid-3");
  });

  it("adds the count to the layout's grid rather than replacing it", () => {
    // A sidebar page that asks for four keeps its rail: the class that draws
    // the rail is the one `layout` chose, and only the COUNT is redirected.
    expect(draw({ columns: { base: 4 } }, "sidebar").row.className).toBe("sf-grid-3 sfb-cols");
    expect(draw({ columns: { base: 5 } }).row.className).toBe("sf-grid-4 sfb-cols");
  });

  it("names only the screens the merchant answered for", () => {
    expect(draw({ columns: { mobile: 1 } }).row.className).toBe("sf-grid-4 sfb-cols-m");
    expect(draw({ columns: { base: 4, mobile: 1 } }).row.className).toBe("sf-grid-4 sfb-cols sfb-cols-m");
  });

  it("writes each screen's count as its own variable", () => {
    const { row } = draw({ columns: { base: 4, mobile: 1 } });
    expect(row.style.getPropertyValue("--sfb-cols")).toBe("4");
    expect(row.style.getPropertyValue("--sfb-cols-m")).toBe("1");
  });
});

describe("the collection page's card chrome", () => {
  it("writes the corners and the button fill on the grid", () => {
    const { row } = draw({ look: { cardCorners: "sharp", cardButtons: "soft" } });
    expect(row.getAttribute("data-card-corners")).toBe("sharp");
    expect(row.getAttribute("data-card-buttons")).toBe("soft");
  });

  it("writes nothing when the merchant answered neither", () => {
    const { row } = draw();
    expect(row.hasAttribute("data-card-corners")).toBe(false);
    expect(row.hasAttribute("data-card-buttons")).toBe(false);
  });
});

describe("the collection page's card photo", () => {
  it("passes nothing, so the cards follow the store", () => {
    expect(draw().card.dataset.fit).toBe("undefined");
    expect(draw().card.dataset.ratio).toBe("undefined");
  });

  it("passes the section's shape and fit to every card", () => {
    const { card } = draw({ imageFit: "cover", imageRatio: "3 / 4" });
    expect(card.dataset.fit).toBe("cover");
    expect(card.dataset.ratio).toBe("3 / 4");
  });
});

/**
 * The words above the grid.
 *
 * The rule the tests are really about: **one page draws every collection**, so
 * the merchant's heading is an OVERRIDE and unset has to keep each collection's
 * own name. Getting that backwards would rename every category page in the shop
 * at once, in one language, on the day it shipped.
 */
describe("the collection page's heading", () => {
  it("keeps the collection's own name when the merchant typed none", () => {
    expect(drawHeader(undefined, { name: "Sarees" }).h1?.textContent).toBe("Sarees");
  });

  it("falls back to the shop's own wording with no collection either", () => {
    expect(drawHeader().h1?.textContent).toBe(I18N.en.allProducts);
  });

  it("lets the merchant's words replace it", () => {
    expect(drawHeader({ heading: "Shop everything" }, { name: "Sarees" }).h1?.textContent).toBe(
      "Shop everything",
    );
  });

  it("treats a heading of spaces as no heading", () => {
    expect(drawHeader({ heading: "   " }, { name: "Sarees" }).h1?.textContent).toBe("Sarees");
  });

  it("draws the line under the heading when there is one", () => {
    expect(drawHeader({ subheading: "Free delivery over 2000 taka" }).line?.textContent).toBe(
      "Free delivery over 2000 taka",
    );
    expect(drawHeader().line).toBeNull();
  });

  it("takes the line away with the heading, never on its own", () => {
    const { h1, text } = drawHeader({ hideHeading: true, subheading: "Free delivery" });
    expect(h1).toBeNull();
    expect(text).not.toContain("Free delivery");
  });

  it("counts the results until the merchant says not to", () => {
    expect(drawHeader().text).toContain(I18N.en.results);
    expect(drawHeader({ hideCount: true }).text).not.toContain(I18N.en.results);
  });

  it("keeps the count when only the heading is hidden", () => {
    // Two switches, because a page that opens with a hero still counts its
    // results — and a thin catalogue wants the opposite.
    const { h1, text } = drawHeader({ hideHeading: true });
    expect(h1).toBeNull();
    expect(text).toContain(I18N.en.results);
  });
});
