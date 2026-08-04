"use client";
// coding-standard: maintained

import { Suspense, useState, type CSSProperties } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useStore,
  useStoreBrands,
  useStoreCategories,
  useStoreProducts,
  useStoreProductsInfinite,
} from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { money } from "@/components/storefront/format";
import { ProductCard } from "@/components/storefront/product-card";
import { SkeletonCard } from "@/components/storefront/sf-skeleton";
import { FilterPanel, type ProductFilters } from "@/components/storefront/filter-panel";
import {
  FilterChips,
  FiltersButton,
  SortSelect,
  type FilterChip,
} from "@/components/storefront/filter-toolbar";
import { useStoreTemplate } from "@/services/stores/use-sf-preview-store";
import { SideDrawer } from "@/components/storefront/side-drawer";
import { LoadMore } from "@/components/storefront/load-more";
import { Pager } from "@/components/storefront/pager";
import {
  catalogInfiniteParams,
  catalogQueryParams,
} from "@/lib/storefront-catalog-params";
import type { ProductListResult } from "@/lib/storefront-client";

const wrap: CSSProperties = {
  maxWidth: "var(--maxw)",
  margin: "0 auto",
  width: "100%",
  padding: "18px var(--pad) 40px",
};

function CollectionInner({
  initialProducts,
}: {
  initialProducts?: ProductListResult;
}) {
  const { slug } = useStoreContext();
  const { t } = useStorefrontUI();
  const router = useRouter();
  const pathname = usePathname();
  // The URL is the single source of truth for every filter, so header/home
  // links, panel rows, chips and the drawer all share one code path (same-route
  // query navigation re-renders without remounting).
  const sp = useSearchParams();
  const categoryId = sp.get("categoryId") ?? "";
  const brandId = sp.get("brandId") ?? "";
  const minPrice = sp.get("minPrice") ?? "";
  const maxPrice = sp.get("maxPrice") ?? "";
  const inStock = sp.get("inStock") === "1";
  const sort = sp.get("sort") ?? "";
  const filterKey = [categoryId, brandId, minPrice, maxPrice, inStock, sort].join("|");

  const [page, setPage] = useState(1);
  // Reset pagination whenever any filter/sort changes (render-time adjust).
  const [prevKey, setPrevKey] = useState(filterKey);
  if (prevKey !== filterKey) {
    setPrevKey(filterKey);
    setPage(1);
  }
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: store } = useStore(slug);
  const { data: categories } = useStoreCategories(slug);
  const { data: brands } = useStoreBrands(slug);

  // Which listing mode the merchant chose (Customize → Collections), with any
  // unsaved draft from the live preview applied. `store` is SSR-seeded in
  // shop/layout.tsx, so this is settled on the first render and the page never
  // flips modes under the shopper.
  const mode = useStoreTemplate(store, "pagination");
  const paged = mode === "pages";
  const filterState = { categoryId, brandId, minPrice, maxPrice, inStock: inStock ? "1" : "", sort };

  // Both hooks are declared (hooks can't be conditional) and gated by `enabled`,
  // so only the chosen one fetches. Params are built through the shared builders
  // because the params object IS the cache key — `page.tsx` seeds page 1 with the
  // identical object (see storefront-catalog-params).
  const pagedQuery = useStoreProducts(
    slug,
    catalogQueryParams(filterState, page),
    paged,
    page === 1 ? initialProducts : undefined,
  );
  const infiniteQuery = useStoreProductsInfinite(
    slug,
    catalogInfiniteParams(filterState),
    !paged,
    initialProducts,
  );

  const setParams = (patch: Record<string, string | undefined>) => {
    const qs = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "") qs.delete(k);
      else qs.set(k, v);
    }
    const s = qs.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };

  const currency = store?.currency;
  const variant = useStoreTemplate(store, "collection");
  const infinitePages = infiniteQuery.data?.pages ?? [];
  const items = paged
    ? (pagedQuery.data?.items ?? [])
    : infinitePages.flatMap((p) => p.items);
  // Every page carries the same totals, so page 1 answers for the whole set.
  const pagination = paged ? pagedQuery.data?.pagination : infinitePages[0]?.pagination;
  const total = pagination?.total ?? items.length;
  const isLoading = paged ? pagedQuery.isLoading : infiniteQuery.isLoading;
  const cats = categories ?? [];
  const brandList = brands ?? [];
  const activeCat = cats.find((c) => c._id === categoryId);
  const activeBrand = brandList.find((b) => b._id === brandId);
  const filters: ProductFilters = { categoryId, brandId, minPrice, maxPrice, inStock };

  const chips: FilterChip[] = [];
  if (activeCat)
    chips.push({
      key: "category",
      label: activeCat.name,
      onRemove: () => setParams({ categoryId: undefined }),
    });
  if (activeBrand)
    chips.push({
      key: "brand",
      label: activeBrand.name,
      onRemove: () => setParams({ brandId: undefined }),
    });
  if (minPrice || maxPrice)
    chips.push({
      key: "price",
      label:
        minPrice && maxPrice
          ? `${money(+minPrice, currency)} – ${money(+maxPrice, currency)}`
          : minPrice
            ? `≥ ${money(+minPrice, currency)}`
            : `≤ ${money(+maxPrice, currency)}`,
      onRemove: () => setParams({ minPrice: undefined, maxPrice: undefined }),
    });
  if (inStock)
    chips.push({
      key: "stock",
      label: t.inStockFilter,
      onRemove: () => setParams({ inStock: undefined }),
    });
  const clearAll = () =>
    setParams({
      categoryId: undefined,
      brandId: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      inStock: undefined,
    });

  // A brand-only filter turns the page into that brand's landing page.
  const heading = activeBrand && !activeCat ? activeBrand.name : (activeCat?.name ?? t.allProducts);
  const panel = (
    <FilterPanel categories={cats} brands={brandList} filters={filters} onChange={setParams} />
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
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "var(--h2)", fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            {heading}
          </h1>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>
            {total} {t.results}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
          {/* Sidebar template shows the panel inline on desktop — the button is mobile-only there. */}
          <FiltersButton
            activeCount={chips.length}
            onClick={() => setDrawerOpen(true)}
            className={variant === "sidebar" ? "sf-mobile-only" : undefined}
          />
          <SortSelect sort={sort} onChange={(s) => setParams({ sort: s })} />
        </div>
      </div>

      <FilterChips chips={chips} onClearAll={clearAll} />

      {variant === "sidebar" ? (
        <div style={{ display: "grid", gridTemplateColumns: "var(--colmain)", gap: "var(--gap)" }}>
          <aside
            className="sf-desktop-only"
            style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 18, alignSelf: "start" }}
          >
            {panel}
          </aside>
          {grid}
        </div>
      ) : (
        grid
      )}

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
            style={{ width: "100%", background: "var(--primary)", color: "var(--on-primary)", border: "none", padding: "12px 22px", borderRadius: 8, fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
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

export default function CollectionPage({
  initialProducts,
}: {
  initialProducts?: ProductListResult;
}) {
  const { t } = useStorefrontUI();
  return (
    <Suspense fallback={<p style={{ padding: 24, fontSize: 13, color: "var(--muted)" }}>{t.loading}</p>}>
      <CollectionInner initialProducts={initialProducts} />
    </Suspense>
  );
}
