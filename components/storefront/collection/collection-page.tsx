"use client";
// coding-standard: maintained

import { Suspense, useState, type CSSProperties } from "react";
import {
  useStore,
  useStoreProducts,
  useStoreProductsInfinite,
} from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { ProductCard } from "@/components/storefront/product-card";
import { SkeletonCard } from "@/components/storefront/sf-skeleton";
import { FilterPanel } from "@/components/storefront/filter-panel";
import {
  FilterChips,
  FiltersButton,
  SortSelect,
} from "@/components/storefront/filter-toolbar";
import { useCatalogFacets } from "@/components/storefront/use-catalog-facets";
import { useStoreTemplate } from "@/services/stores/use-sf-preview-store";
import { SideDrawer } from "@/components/storefront/side-drawer";
import { Breadcrumb } from "@/components/storefront/breadcrumb";
import {
  SubcategoryStrip,
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
import { brandButton } from "@/lib/storefront-button";

const wrap: CSSProperties = {
  maxWidth: "var(--maxw)",
  margin: "0 auto",
  width: "100%",
  padding: "18px var(--pad) 40px",
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
}: {
  initialProducts?: ProductListResult;
  initialPage: number;
  collection?: CatalogCategoryDetail;
  campaign?: StoreCampaignDetail;
  hideCampaignBanner?: boolean;
  crumbs?: Crumb[];
  layout?: string;
  pagination?: string;
}) {
  const { slug, base } = useStoreContext();
  const { t } = useStorefrontUI();
  // On a path page the collection comes from the ROUTE, not the query string —
  // there is no `?categoryId=` to read and the facet must not be user-editable.
  const categoryPath = collection?.slugPath;
  // Every facet lives in the URL; the hook owns reading it, the chips and the
  // reset. Shared with /search so the two pages can't drift on what a facet does.
  const facets = useCatalogFacets({ categoryPath });
  const { filterKey, setParams, chips, clearAll, sort, page, setPage } = facets;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: store } = useStore(slug);

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

  // A path page is named by its collection; otherwise a brand-only filter turns
  // the page into that brand's landing page.
  // The narrowest active facet names the page: a chosen sub-category is what the
  // shopper is actually looking at, so it beats its own parent.
  const heading =
    collection?.name ??
    (facets.activeBrand && !facets.activeCategory
      ? facets.activeBrand.name
      : (facets.activeSubcategory?.name ??
        facets.activeCategory?.name ??
        t.allProducts));
  const panel = (
    <FilterPanel
      categories={facets.categories}
      brands={facets.brands}
      tags={facets.tags}
      filters={facets.filters}
      onChange={setParams}
      // The collection is the URL here, so offering it as a facet would let a
      // shopper filter themselves off the page they are standing on.
      hideCategories={!!categoryPath}
    />
  );

  const gridClass = variant === "grid3" || variant === "sidebar" ? "sf-grid-3" : "sf-grid-4";
  const grid = (
    <div className={gridClass} style={{ alignContent: "start" }}>
      {isLoading
        ? Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)
        : items.map((p) => <ProductCard key={p._id} product={p} currency={currency} />)}
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
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
        <div>
          {campaign ? null : (
            <h1 style={{ fontSize: "var(--h2)", fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>
              {heading}
            </h1>
          )}
          <span style={{ fontSize: 13, color: "var(--muted)" }}>
            {total} {t.results}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
          <FiltersButton
            activeCount={chips.length}
            onClick={() => setDrawerOpen(true)}
          />
          <SortSelect sort={sort} onChange={(s) => setParams({ sort: s })} />
        </div>
      </div>

      {/* Under the heading, above the filters: it is navigation into the tree,
          not another facet — and a shopper scanning the page should read the
          collection's name before its subdivisions. */}
      <SubcategoryStrip
        base={base}
        items={subcategories}
        activeId={collection?._id}
      />

      <FilterChips chips={chips} onClearAll={clearAll} />

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

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        side="left"
        title={t.filters}
        headerAccessory={
          chips.length > 0 ? (
            <button
              type="button"
              onClick={clearAll}
              style={{ fontSize: 12, fontWeight: 600, fontFamily: "inherit", color: "var(--muted)", background: "none", border: "none", textDecoration: "underline", cursor: "pointer" }}
            >
              {t.reset}
            </button>
          ) : undefined
        }
        footer={
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            style={{ ...brandButton({ radius: 8, padding: "12px 22px", fontSize: 14 }), width: "100%", border: "none", fontFamily: "inherit", fontWeight: 700, cursor: "pointer" }}
          >
            {/* Live count — filters apply instantly, this just closes the drawer. */}
            {t.showResults.replace("{n}", String(total))}
          </button>
        }
      >
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px 16px" }}>{panel}</div>
      </SideDrawer>
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
      />
    </Suspense>
  );
}
