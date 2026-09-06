// coding-standard: maintained

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  FeaturedGrid,
  LatestGrid,
  PicksGrid,
} from "@/components/storefront/home/sections/product-sections";
import type { SectionProps } from "@/components/storefront/home/home-shared";
import type { CatalogProduct } from "@/lib/storefront-client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/shop",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/services/storefront/store-context", () => ({
  useStoreContext: () => ({ slug: "shop", base: "/shop" }),
}));
vi.mock("@/services/stores/use-sf-preview-store", () => ({
  useSfPreview: () => null,
  useSfPreviewImage: () => null,
}));
vi.mock("@/services/storefront/use-image-fit", () => ({
  useStoreImageFit: () => "cover",
}));
vi.mock("@/services/storefront/use-image-ratio", () => ({
  useStoreImageRatio: () => "square",
}));

/* `ProductCard` reaches for the store through TanStack Query. A real (empty)
   client is used rather than mocking the hooks module: the card pulls a growing
   set of hooks from it, and a mock has to be extended every time one is added
   — for a test whose subject is WHICH products a section renders. */
const renderSection = (ui: React.ReactElement) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {ui}
    </QueryClientProvider>,
  );

const product = (name: string): CatalogProduct =>
  ({ _id: name, name, slug: name, price: 100, images: [] }) as unknown as CatalogProduct;

/** The store-wide lists a section falls back to when nothing is configured. */
const FEATURED = [product("Store featured")];
const LATEST = [product("Store latest")];
/** What the page fetched FOR THIS INSTANCE because the merchant configured it. */
const CONFIGURED = [product("Chosen collection item")];

const props = {
  base: "/shop",
  featured: FEATURED,
  latest: LATEST,
  categories: [],
  campaigns: [],
  t: { featured: "Featured", newArrivals: "New arrivals", weeklyPicks: "Weekly picks", viewAll: "View all" },
  store: { name: "Shop" },
} as unknown as SectionProps;

const configured = {
  ...props,
  config: { key: "k1", source: "category", categoryId: "c1", title: "Winter coats" },
  items: CONFIGURED,
} as unknown as SectionProps;

describe("a configured product section renders the products it was given", () => {
  /* The regression this file exists for. `PicksGrid` drew its heading and its
     "View all" from the merchant's configured collection and its PRODUCTS from
     the store-wide featured list, so a Weekly picks row pointed at "Winter
     coats" showed the shop's featured items under that heading. `picks-grid` is
     in `CONFIGURABLE`, so the page had already fetched the right products and
     the section discarded them. Asserted for all three grids, because the three
     are near-copies and the next one to diverge will be a different one. */
  it.each([
    ["FeaturedGrid", FeaturedGrid],
    ["LatestGrid", LatestGrid],
    ["PicksGrid", PicksGrid],
  ])("%s", (_name, Section) => {
    renderSection(<Section {...configured} />);
    expect(screen.getByText("Chosen collection item")).toBeInTheDocument();
    expect(screen.getByText("Winter coats")).toBeInTheDocument();
    expect(screen.queryByText("Store featured")).not.toBeInTheDocument();
    expect(screen.queryByText("Store latest")).not.toBeInTheDocument();
  });
});

describe("an unconfigured product section keeps its built-in source", () => {
  it("FeaturedGrid and PicksGrid draw the featured list", () => {
    renderSection(<FeaturedGrid {...props} />);
    expect(screen.getByText("Store featured")).toBeInTheDocument();
    renderSection(<PicksGrid {...props} />);
    expect(screen.getAllByText("Store featured").length).toBe(2);
  });

  it("LatestGrid draws the newest list", () => {
    renderSection(<LatestGrid {...props} />);
    expect(screen.getByText("Store latest")).toBeInTheDocument();
  });
});

describe("the row's button", () => {
  const withConfig = (config: Record<string, unknown>) =>
    ({ ...props, config: { key: "k1", ...config }, items: CONFIGURED }) as unknown as SectionProps;

  it("says 'View all' and points at the catalogue by default", () => {
    renderSection(<FeaturedGrid {...props} />);
    // `ViewAll` renders "{label} →", so the arrow is part of the text node.
    expect(screen.getByRole("link", { name: /View all/ })).toHaveAttribute(
      "href",
      "/shop/products",
    );
  });

  it("takes the merchant's wording", () => {
    renderSection(<FeaturedGrid {...withConfig({ source: "manual", ctaLabel: "See the edit" })} />);
    expect(screen.getByRole("link", { name: /See the edit/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /View all/ })).not.toBeInTheDocument();
  });

  it("takes the merchant's destination", () => {
    /* The reason `ctaHref` exists: a hand-picked row has no collection to
       derive a destination from, so without it the button lands on the full
       catalogue — products the merchant deliberately did not pick. */
    renderSection(<FeaturedGrid {...withConfig({ source: "manual", ctaHref: "/winter" })} />);
    expect(screen.getByRole("link", { name: /View all/ })).toHaveAttribute(
      "href",
      "/shop/winter",
    );
  });

  it("can be switched off entirely", () => {
    renderSection(<FeaturedGrid {...withConfig({ source: "manual", showCta: false })} />);
    expect(screen.queryByRole("link", { name: /View all/ })).not.toBeInTheDocument();
  });

  it("stays visible when the flag is absent", () => {
    // Every row had a button before `showCta` existed; unset must not remove it.
    renderSection(<FeaturedGrid {...withConfig({ source: "manual" })} />);
    expect(screen.getByRole("link", { name: /View all/ })).toBeInTheDocument();
  });
});

describe("a hand-picked row renders in the merchant's order", () => {
  it("re-sorts the response against productIds", () => {
    const shuffled = [product("Third"), product("First"), product("Second")];
    renderSection(
      <FeaturedGrid
        {...({
          ...props,
          config: { key: "k1", source: "manual", productIds: ["First", "Second", "Third"] },
          items: shuffled,
        } as unknown as SectionProps)}
      />,
    );
    const names = screen.getAllByText(/First|Second|Third/).map((n) => n.textContent);
    expect(names).toEqual(["First", "Second", "Third"]);
  });
});
