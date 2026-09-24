import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18N } from "@/lib/storefront-i18n";
import {
  DEFAULT_FILTER_SETTINGS,
  orderFilterGroups,
  resolveFilterSettings,
  type ResolvedFilterSettings,
} from "@/lib/storefront-filters";
import type { CatalogFacets } from "@/components/storefront/use-catalog-facets";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/services/storefront/store-context", () => ({
  useStoreContext: () => ({ slug: "rmc", base: "/shop" }),
}));
vi.mock("@/services/storefront/ui-context", () => ({ useStorefrontUI: () => ({ t: I18N.en }) }));

const { FilterPanel } = await import("@/components/storefront/filter-panel");

const lights = {
  _id: "lights",
  name: "Lights",
  slug: "lights",
  slugPath: "lights",
  children: [{ _id: "led", name: "Led", slug: "led", slugPath: "lights/led" }],
};

function facetsWith(over: Partial<CatalogFacets> = {}): CatalogFacets {
  return {
    filters: {
      categoryId: "",
      subcategoryId: "",
      brandIds: [],
      tags: [],
      options: {},
      minPrice: "",
      maxPrice: "",
      inStock: false,
    },
    params: {},
    filterKey: "",
    sort: "featured",
    setSort: vi.fn(),
    page: 1,
    setPage: vi.fn(),
    chips: [],
    clearAll: vi.fn(),
    setParams: vi.fn(),
    toggle: vi.fn(),
    categories: [lights],
    data: {
      total: 3,
      categories: [
        { _id: "lights", productCount: 3 },
        { _id: "led", productCount: 2 },
      ],
      brands: [
        { _id: "b1", name: "Acme", productCount: 2 },
        { _id: "b2", name: "Zeta", productCount: 1 },
      ],
      tags: [],
      options: [{ name: "Size", values: [{ value: "M", productCount: 1 }, { value: "L", productCount: 2 }] }],
      price: { min: 100, max: 900, presets: [{ max: 500, productCount: 2 }, { min: 500, productCount: 1 }] },
      anyOutOfStock: false,
    },
    activeGroups: new Set(),
    currency: "BDT",
    ...over,
  };
}

function draw(facets: CatalogFacets, settings: ResolvedFilterSettings = DEFAULT_FILTER_SETTINGS, categoryNav = false) {
  const groups = orderFilterGroups({
    facets: facets.data,
    settings,
    hideCategory: false,
    inStockActive: false,
    active: facets.activeGroups,
  }).map((g) => ({ ...g, open: true }));
  return render(<FilterPanel groups={groups} ctx={{ facets, settings, categoryNav }} />);
}

beforeEach(() => push.mockReset());

describe("FilterPanel — category accordion (P3, F5)", () => {
  it("folds a department until its row is tapped, then offers All ‹Parent› first", () => {
    const facets = facetsWith();
    draw(facets);
    expect(screen.queryByText("Led")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Lights/ }));
    expect(screen.getByText("All Lights")).toBeTruthy();
    fireEvent.click(screen.getByText("Led"));
    expect(facets.setParams).toHaveBeenCalledWith({ categoryId: "lights", subcategoryId: "led" });
  });

  it("on the bare listing, goes to the category's own page carrying the other filters", () => {
    window.history.replaceState(null, "", "/shop/products?brandId=b1&page=3");
    draw(facetsWith(), DEFAULT_FILTER_SETTINGS, true);
    fireEvent.click(screen.getByRole("button", { name: /Lights/ }));
    fireEvent.click(screen.getByText("Led"));
    expect(push).toHaveBeenCalledWith("/shop/lights/led?brandId=b1");
  });
});

describe("FilterPanel — facets", () => {
  it("toggles an option value into its opt.* param, matching the URL case-insensitively", () => {
    const facets = facetsWith({
      filters: { ...facetsWith().filters, options: { size: ["l"] } },
    });
    draw(facets);
    expect(screen.getByRole("button", { name: /^L\s*2$/ }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: /^M\s*1$/ }));
    expect(facets.setParams).toHaveBeenCalledWith({ "opt.size": "l,M" });
  });

  it("brands toggle when multi-select is on (F2)", () => {
    const facets = facetsWith();
    draw(facets);
    fireEvent.click(screen.getByRole("checkbox", { name: /Zeta/ }));
    expect(facets.toggle).toHaveBeenCalledWith("brandId", "b2");
  });

  it("brands replace one another when multi-select is off", () => {
    const facets = facetsWith();
    draw(facets, resolveFilterSettings({ brandMulti: false }));
    fireEvent.click(screen.getByRole("radio", { name: /Zeta/ }));
    expect(facets.setParams).toHaveBeenCalledWith({ brandId: "b2" });
  });

  it("a price range sets both bounds, and tapping it again clears them (F3)", () => {
    const facets = facetsWith({
      filters: { ...facetsWith().filters, maxPrice: "500" },
    });
    draw(facets);
    const under = screen.getByRole("button", { name: /Under/ });
    expect(under.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(under);
    expect(facets.setParams).toHaveBeenCalledWith({ minPrice: undefined, maxPrice: undefined });
    fireEvent.click(screen.getByRole("button", { name: /and up/ }));
    expect(facets.setParams).toHaveBeenCalledWith({ minPrice: "500", maxPrice: undefined });
  });

  it("hides Availability on a shop where nothing is out of stock (F6)", () => {
    draw(facetsWith());
    expect(screen.queryByRole("switch")).toBeNull();
  });
});
