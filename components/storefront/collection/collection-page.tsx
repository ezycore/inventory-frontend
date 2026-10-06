"use client";
// coding-standard: maintained

import { Suspense, type CSSProperties } from "react";
import {
  useStore,
  useStoreProducts,
  useStoreProductsInfinite,
} from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { ProductCard } from "@/components/storefront/product-card";
import { SkeletonCard } from "@/components/storefront/sf-skeleton";
import { CatalogFilters } from "@/components/storefront/filters/catalog-filters";
import { useCatalogFacets } from "@/components/storefront/use-catalog-facets";
import { useStoreFilters } from "@/components/storefront/use-store-filters";
import { useSfPreview, useStoreTemplate } from "@/services/stores/use-sf-preview-store";
import { resolveMenuSettings } from "@/lib/storefront-menu";
import { Breadcrumb } from "@/components/storefront/breadcrumb";
import {
  SubcategoryStrip,
  stripParent,
  subcategoriesFor,
} from "@/components/storefront/subcategory-strip";
import type { Crumb } from "@/lib/storefront-breadcrumb";
import { LoadMore } from "@/components/storefront/load-more";
import { Pager } from "@/components/storefront/pager";
import {
  campaignInfiniteParams,
  campaignQueryParams,
  catalogInfiniteParams,
  catalogQueryParams,
  categoryPathInfiniteParams,
  categoryPathQueryParams,
} from "@/lib/storefront-catalog-params";
import type {
  CatalogCategoryDetail,
  ProductListResult,
  StoreCampaignDetail,
} from "@/lib/storefront-client";
import { CampaignHeader } from "@/components/storefront/campaign/campaign-header";
import { responsiveClasses, responsiveVars } from "@/lib/storefront-builder/responsive";
import type { Responsive } from "@/lib/storefront-builder/settings";
import { sectionCardLook, type CardLookSettings } from "@/lib/storefront-builder/card-media";

const wrap: CSSProperties = {
  maxWidth: "var(--maxw)",
  margin: "0 auto",
  width: "100%",
  // `--sf-page-top` shrinks on phones (storefront.css).
  padding: "var(--sf-page-top, 18px) var(--pad) 40px",
};

/**
 * The collection grid, shared by two routes.
 *
 * `/products` renders it bare (every product, filters from the query string).
 * `/{category}/{sub?}` renders it with a resolved `collection`, which swaps the
 * `categoryId` query param for a `categoryPath` one — the backend then decides
 * whether to match `categoryId` (a parent, so the whole branch) or
 * `subcategoryId` (one child). `/campaigns/{slug}` renders it with a `campaign`,
 * which adds a `campaign` param the backend AND-s onto the facets. Same
 * component, so the three can never drift apart in layout, pagination mode or
 * filter behaviour.
 *
 * A campaign is NOT modelled as another kind of collection: its scope can be a
 * tag, a product list or the whole store, so there is no category to hide from
 * the filter panel and every facet stays useful inside it — narrowing a sale
 * spanning eight categories to one is the case the panel is for.
 */
function CollectionInner({
  initialProducts,
  initialPage,
  collection,
  campaign,
  hideCampaignBanner,
  crumbs,
  layout,
  pagination: paginationChoice,
  cards,
  header,
}: {
  initialProducts?: ProductListResult;
  initialPage: number;
  collection?: CatalogCategoryDetail;
  campaign?: StoreCampaignDetail;
  hideCampaignBanner?: boolean;
  crumbs?: Crumb[];
  layout?: string;
  pagination?: string;
  cards?: CollectionCards;
  header?: CollectionHeader;
}) {
  const { slug, base } = useStoreContext();
  const { t } = useStorefrontUI();
  // On a path page the collection comes from the ROUTE, not the query string —
  // there is no `?categoryId=` to read and the facet must not be user-editable.
  const categoryPath = collection?.slugPath;
  const { data: store } = useStore(slug);
  // Site-wide (Customize → Filters & sort), with the section's legacy
  // `sidebar` layout read as a sidebar placement.
  const filterSettings = useStoreFilters(store, layout);
  // Every facet lives in the URL; the hook owns reading it, the chips and the
  // reset. Shared with /search so the two pages can't drift on what a facet does.
  const facets = useCatalogFacets({
    categoryPath,
    campaign: campaign?.slug ?? undefined,
    defaultSort: filterSettings.sort.default,
  });
  const { filterKey, page, setPage } = facets;

  // Which listing mode the page or the store chose, with any
  // unsaved draft from the live preview applied. `store` is SSR-seeded in
  // shop/layout.tsx, so this is settled on the first render and the page never
  // flips modes under the shopper.
  const mode = useStoreTemplate(store, "pagination", paginationChoice);
  const paged = mode === "pages";
  const filterState = facets.params;

  // Both hooks are declared (hooks can't be conditional) and gated by `enabled`,
  // so only the chosen one fetches. Params are built through the shared builders
  // because the params object IS the cache key — `page.tsx` seeds page 1 with the
  // identical object (see storefront-catalog-params).
  const campaignSlug = campaign?.slug;
  const pagedQuery = useStoreProducts(
    slug,
    campaignSlug
      ? campaignQueryParams(campaignSlug, filterState, page)
      : categoryPath
        ? categoryPathQueryParams(categoryPath, filterState, page)
        : catalogQueryParams(filterState, page),
    paged,
    // The server seeded ONE page — the one `?page=` named at request time. Hand
    // it over only while the shopper is still on it; seeding page 5 with page
    // 3's rows would render the wrong products as though they were fresh.
    page === initialPage ? initialProducts : undefined,
  );
  const infiniteQuery = useStoreProductsInfinite(
    slug,
    campaignSlug
      ? campaignInfiniteParams(campaignSlug, filterState)
      : categoryPath
        ? categoryPathInfiniteParams(categoryPath, filterState)
        : catalogInfiniteParams(filterState),
    !paged,
    initialProducts,
  );

  const currency = facets.currency;
  const variant = useStoreTemplate(store, "collection", layout);
  const infinitePages = infiniteQuery.data?.pages ?? [];
  const items = paged
    ? (pagedQuery.data?.items ?? [])
    : infinitePages.flatMap((p) => p.items);
  // Every page carries the same totals, so page 1 answers for the whole set.
  const pagination = paged ? pagedQuery.data?.pagination : infinitePages[0]?.pagination;
  const total = pagination?.total ?? items.length;
  const isLoading = paged ? pagedQuery.isLoading : infiniteQuery.isLoading;
  // Drill-down row for a collection page: this collection's children, or its
  // siblings when it IS a child. See `subcategoriesFor`.
  const subcategories = subcategoriesFor(collection, facets.categories);
  // How that row draws is a MENU setting (Customize → Menu), per device, with
  // the Customize draft applied so the preview follows the panel.
  const previewMenu = useSfPreview((s) => s.navMenu);
  const menu = resolveMenuSettings(previewMenu ?? store?.nav?.menu);

  // A path page is named by its collection; otherwise a brand-only filter turns
  // the page into that brand's landing page.
  // The narrowest active facet names the page: a chosen sub-category is what the
  // shopper is actually looking at, so it beats its own parent.
  const heading =
    /* The merchant's own words win — and name EVERY collection, which is what
       the control's hint warns before they type. Trimmed, so a heading of
       spaces is no heading: the same treatment `campaign-offers` gives its own. */
    header?.heading?.trim() ||
    collection?.name ||
    (facets.activeBrand && !facets.activeCategory
      ? facets.activeBrand.name
      : (facets.activeSubcategory?.name ??
        facets.activeCategory?.name ??
        t.allProducts));
  const subheading =
    campaign || header?.hideHeading ? undefined : header?.subheading?.trim() || undefined;
  const grid = (
    <div
      className={gridClass(variant, cards?.columns)}
      style={{ alignContent: "start", ...responsiveVars("sfb-cols", cards?.columns) }}
      {...sectionCardLook(cards?.look ?? {})}
    >
      {isLoading
        ? Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)
        : items.map((p) => (
            <ProductCard
              key={p._id}
              product={p}
              currency={currency}
              imageFit={cards?.imageFit}
              imageRatio={cards?.imageRatio}
            />
          ))}
    </div>
  );

  return (
    <div style={wrap}>
      {/* Collection pages only — the bare `/products` listing is a top-level
          page with nothing above it but home, and `Breadcrumb` drops a trail
          that short anyway. */}
      {crumbs ? <Breadcrumb base={base} crumbs={crumbs} /> : null}
      {/* The campaign banner IS this page's `<h1>`, so the toolbar below drops
          its own heading rather than titling the page twice. */}
      {campaign && !hideCampaignBanner ? (
        <CampaignHeader campaign={campaign} currency={currency} t={t} />
      ) : null}
      {/* A campaign page's banner IS its heading, so neither the title nor the
          merchant's override belongs here — `campaign-main` has no heading
          setting to give one, and this branch predates both. */}
      <div style={{ marginBottom: 14 }}>
        {campaign || header?.hideHeading ? null : (
          <h1 style={{ fontSize: "var(--h2)", fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            {heading}
          </h1>
        )}
        {/* "A line under the heading" — with no heading there is nothing to
            sit under, so it goes with it rather than floating alone. */}
        {subheading ? (
          <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "0 0 5px", maxWidth: "62ch" }}>
            {subheading}
          </p>
        ) : null}
        {/* Desktop only — on a phone the count rides in the filter toolbar,
            which stays on screen while the heading scrolls away. */}
        {header?.hideCount ? null : (
          <span className="sf-desktop-only" style={{ fontSize: 13, color: "var(--muted)" }}>
            {total} {t.results}
          </span>
        )}
      </div>

      {/* Under the heading, above the filters: it is navigation into the tree,
          not another facet — and a shopper scanning the page should read the
          collection's name before its subdivisions. */}
      <SubcategoryStrip
        base={base}
        items={subcategories}
        activeId={collection?._id}
        parent={stripParent(collection)}
        parentImage={facets.categories.find((c) => c._id === stripParent(collection)?._id)?.image}
        allLabel={t.menuAllIn.replace("{name}", stripParent(collection)?.name ?? "")}
        display={{ base: menu.desktop.collectionStrip, mobile: menu.mobile.collectionStrip }}
      />

      <CatalogFilters
        facets={facets}
        settings={filterSettings}
        total={total}
        // Only the bare listing hands a category pick to the category's own
        // page; a campaign keeps it as a facet inside the sale.
        categoryNav={!categoryPath && !campaign}
        hideCategory={!!categoryPath}
        hideCount={header?.hideCount}
      >
        {grid}

        {!isLoading && items.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 16 }}>{t.noResults}</p>
        ) : null}

        {paged && pagination ? (
          <Pager page={pagination.page} totalPages={pagination.totalPages} onChange={setPage} />
        ) : null}

        {!paged && !isLoading && items.length > 0 ? (
          // Keyed on the filters so a new query gets its own auto-load budget —
          // see the note in load-more.tsx.
          <LoadMore
            key={filterKey}
            mode={mode === "infinite" ? "infinite" : "loadMore"}
            hasMore={infiniteQuery.hasNextPage}
            loading={infiniteQuery.isFetchingNextPage}
            onLoad={() => infiniteQuery.fetchNextPage()}
            shown={items.length}
            total={total}
          />
        ) : null}

      </CatalogFilters>
    </div>
  );
}

export function CollectionPageView({
  initialProducts,
  initialPage = 1,
  collection,
  campaign,
  hideCampaignBanner,
  crumbs,
  layout,
  pagination,
  cards,
  header,
}: {
  initialProducts?: ProductListResult;
  /**
   * Which page `initialProducts` holds — the `?page=` the server rendered for.
   * Passed rather than re-read from the URL because the client's cursor moves as
   * the shopper pages, and the seed is only valid for the page it was fetched at.
   */
  initialPage?: number;
  /** Set by the `/{category}/{sub?}` route; absent on the bare `/products` page. */
  collection?: CatalogCategoryDetail;
  /** Set by the `/campaigns/{slug}` route — draws the banner and scopes the grid. */
  campaign?: StoreCampaignDetail;
  /**
   * The `campaign-main` core section's own choice, for a merchant who writes
   * their own headline above the grid. It hides the BANNER only — `campaign`
   * still scopes the products, or the page would list the whole catalogue under
   * that headline.
   */
  hideCampaignBanner?: boolean;
  /** Built server-side so the visible trail matches the page's JSON-LD exactly. */
  crumbs?: Crumb[];
  /**
   * The `collection-grid` core section's own choices, once the collection page
   * is on the builder — raw `templates.collection` / `templates.pagination`
   * ids, unset on every page the migration builds.
   */
  layout?: string;
  pagination?: string;
  /** That section's cards: how many to a line, and the photo they are drawn in. */
  cards?: CollectionCards;
  /** That section's words above the grid. */
  header?: CollectionHeader;
}) {
  const { t } = useStorefrontUI();
  return (
    <Suspense fallback={<p style={{ padding: 24, fontSize: 13, color: "var(--muted)" }}>{t.loading}</p>}>
      <CollectionInner
        initialProducts={initialProducts}
        initialPage={initialPage}
        collection={collection}
        campaign={campaign}
        hideCampaignBanner={hideCampaignBanner}
        crumbs={crumbs}
        layout={layout}
        pagination={pagination}
        cards={cards}
        header={header}
      />
    </Suspense>
  );
}

/**
 * What the `collection-grid` section says about the cards, resolved to values
 * the page can use. Absent on a campaign page, which keeps following the store.
 */
/**
 * The `collection-grid` section's words above the grid. Absent on a campaign
 * page, which draws its banner instead.
 */
export interface CollectionHeader {
  /** Replaces the collection's own name — on every collection page. */
  heading?: string;
  subheading?: string;
  hideHeading?: boolean;
  hideCount?: boolean;
}

export interface CollectionCards {
  /** Cards to a line, per screen — over whatever `layout` implies. */
  columns?: Responsive<number>;
  imageFit?: "cover" | "canvas";
  imageRatio?: string;
  /**
   * The cards' corners and button fill.
   *
   * ⚠ On the GRID, not on the page wrapper: the attributes redefine
   * `--radius-md` and the `--btn-*` group for their whole subtree, and this
   * page carries a filter toolbar, chips and a pager that are not cards.
   */
  look?: CardLookSettings;
}

/**
 * The grid's classes.
 *
 * With no count of the merchant's own this is exactly what it always was: the
 * narrow grid for the three-column and sidebar layouts, the wide one otherwise.
 *
 * With a count, the LAYOUT's class still decides which grid draws — a sidebar
 * page keeps its rail and its narrow grid — and the column classes only
 * redirect the count each screen reads. `.sf-grid-3` gained a `--colcols3`
 * fallback for exactly this, so switching the class was never necessary: doing
 * that would have moved a phone-only answer's DESKTOP from three cards to four,
 * which is the screen the merchant did not touch.
 */
function gridClass(variant: string, columns?: Responsive<number>): string {
  const base = variant === "grid3" || variant === "sidebar" ? "sf-grid-3" : "sf-grid-4";
  const own = responsiveClasses("sfb-cols", columns);
  return own ? `${base} ${own}` : base;
}
