// coding-standard: maintained
/**
 * `category-banners` — which collections it advertises, in what order, and what
 * it does when a pick has gone.
 *
 * The rules pinned here are the ones a reader cannot recover from the markup:
 * the merchant's ORDER is the block's order (a promo block is a merchandising
 * decision and which department leads it is the decision), an unpicked block
 * shows the first two rather than nothing (a section that renders blank looks
 * broken in the preview the merchant is staring at), and a collection that no
 * longer resolves is skipped without taking the rest of the block with it.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CategoryBanners } from "@/components/storefront/home/sections/category-sections";
import type { CatalogCategory } from "@/lib/storefront-client";
import { I18N } from "@/lib/storefront-i18n";

const category = (
  id: string,
  name: string,
  extra: Partial<CatalogCategory> = {},
): CatalogCategory => ({
  _id: id,
  name,
  slug: name.toLowerCase().replace(/\s+/g, "-"),
  slugPath: name.toLowerCase().replace(/\s+/g, "-"),
  ...extra,
});

const CATEGORIES = [
  category("a", "Skin care", { description: "Cleansers and serums" }),
  category("b", "Devices"),
  category("c", "Gifting", {
    children: [category("c1", "Hampers")],
  }),
];

/* The section reads the shop's image-fit setting through a query hook, so it
   needs a client even though nothing here resolves. */
const withClient = (ui: React.ReactElement) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {ui}
    </QueryClientProvider>,
  );

/** Only the props `CategoryBanners` reads; the rest of `SectionProps` is unused. */
const renderBanners = (
  config?: { key: string; categoryIds?: string[]; cardShape?: "stacked" | "split" },
  categories: CatalogCategory[] = CATEGORIES,
) =>
  withClient(
    <CategoryBanners
      base=""
      featured={[]}
      latest={[]}
      categories={categories}
      campaigns={[]}
      t={I18N.en}
      store={{ name: "Shop" } as never}
      config={config}
    />,
  );

const cardNames = () =>
  screen.getAllByRole("link").map((a) => a.textContent?.split("Shop now")[0]?.trim());

describe("CategoryBanners", () => {
  it("shows the first two collections before the merchant picks any", () => {
    renderBanners();
    expect(cardNames()).toEqual(["Skin careCleansers and serums", "Devices"]);
  });

  it("renders the merchant's picks in the merchant's order", () => {
    renderBanners({ key: "k", categoryIds: ["b", "a"] });
    expect(cardNames()).toEqual(["Devices", "Skin careCleansers and serums"]);
  });

  // The tree is two levels deep and a sub-collection is a legitimate thing to
  // advertise — a flat `categories.find` would silently drop it.
  it("resolves a sub-collection", () => {
    renderBanners({ key: "k", categoryIds: ["c1"] });
    expect(cardNames()).toEqual(["Hampers"]);
  });

  // Skipped, never pruned: a collection hidden for a week must come back when
  // it returns, and the rest of the block must not vanish with it meanwhile.
  it("skips a pick that no longer resolves and keeps the rest", () => {
    renderBanners({ key: "k", categoryIds: ["gone", "b"] });
    expect(cardNames()).toEqual(["Devices"]);
  });

  it("renders nothing at all when the shop has no collections", () => {
    const { container } = renderBanners(undefined, []);
    expect(container).toBeEmptyDOMElement();
  });

  // Four is the API's cap. Honoured on READ as well, so a document written
  // before the cap — or by something other than the editor — cannot render a
  // fifth card that wraps onto a row of its own.
  it("draws at most four cards", () => {
    renderBanners({ key: "k", categoryIds: ["a", "b", "c", "c1", "a"] });
    expect(screen.getAllByRole("link")).toHaveLength(4);
  });

  it("links each card at its own collection", () => {
    renderBanners({ key: "k", categoryIds: ["b"] });
    expect(screen.getByRole("link")).toHaveAttribute("href", "/devices");
  });

  /* ---- `cardShape` ----
     The class is the whole contract between this component and the stylesheet,
     and it is the only half of the feature testable here: whether `split`
     actually puts the photograph beside the copy is decided by a `min-width`
     rule, and jsdom applies no stylesheet. So these pin what the component
     promises, and the phone half is verified in a browser (see the QA doc). */

  it("draws the stacked card when the merchant has never chosen", () => {
    renderBanners({ key: "k", categoryIds: ["b"] });
    expect(screen.getByRole("link").className).not.toContain("sf-banner-card--split");
  });

  it("draws the split card when the merchant chose it", () => {
    renderBanners({ key: "k", categoryIds: ["b"], cardShape: "split" });
    expect(screen.getByRole("link").className).toContain("sf-banner-card--split");
  });

  // Only an explicit `split` moves the picture. A stored `"stacked"` — which
  // the editor never writes, but an older document or a direct API call might —
  // must land on the same card as unset, not on some third thing.
  it("treats a stored stacked value as the default card", () => {
    renderBanners({ key: "k", categoryIds: ["b"], cardShape: "stacked" });
    expect(screen.getByRole("link").className).not.toContain("sf-banner-card--split");
  });

  // The shape is a look, not a pick: a merchant may choose it before curating,
  // and the block still has to render its fallback collections.
  it("applies the shape to an unpicked block", () => {
    renderBanners({ key: "k", cardShape: "split" });
    const cards = screen.getAllByRole("link");
    expect(cards).toHaveLength(2);
    cards.forEach((card) =>
      expect(card.className).toContain("sf-banner-card--split"),
    );
  });
});
