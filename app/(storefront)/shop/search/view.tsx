"use client";
// coding-standard: maintained

import { Suspense, useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/lib/storefront-toast";
import {
  useStore,
  useStoreProducts,
  useStoreProductsInfinite,
} from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useCartStore } from "@/services/stores/use-cart-store";
import { useHydrated } from "@/hooks/use-hydrated";
import { useStoreTemplate } from "@/services/stores/use-sf-preview-store";
import { storeHref } from "@/lib/storefront-links";
import { thumbImageUrl } from "@/lib/storefront-image";
import { cartLineCap } from "@/lib/storefront-cart-qty";
import { money } from "@/components/storefront/format";
import { Icon } from "@/components/storefront/sf-icons";
import { Media } from "@/components/storefront/sf-bits";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductTagChips } from "@/components/storefront/product-tag-chips";
import { SkeletonCard } from "@/components/storefront/sf-skeleton";
import { LoadMore } from "@/components/storefront/load-more";
import { Pager } from "@/components/storefront/pager";
import { FilterPanel } from "@/components/storefront/filter-panel";
import {
  FilterChips,
  FiltersButton,
  SortSelect,
} from "@/components/storefront/filter-toolbar";
import { SideDrawer } from "@/components/storefront/side-drawer";
import { useCatalogFacets } from "@/components/storefront/use-catalog-facets";
import {
  searchInfiniteParams,
  searchQueryParams,
} from "@/lib/storefront-catalog-params";
import type { CatalogProduct } from "@/lib/storefront-client";

const wrap: CSSProperties = {
  maxWidth: "var(--maxw)",
  margin: "0 auto",
  width: "100%",
  padding: "22px var(--pad) 40px",
};

// Device-level shopper preference (like `sf-theme`) — grid vs list results.
const VIEW_KEY = "sf-search-view";
type SearchView = "grid" | "list";

function SearchInner() {
  const { slug, base } = useStoreContext();
  const { t } = useStorefrontUI();
  const sp = useSearchParams();
  // Read once, into state — the box owns the term after mount, and the effect
  // below pushes it back to the URL. Re-reading `sp` here would fight that.
  const initialQ = sp.get("q") ?? "";
  const [q, setQ] = useState(initialQ);
  // Debounced copy of `q` drives the API query — one request per pause in
  // typing instead of one per keystroke.
  const [debouncedQ, setDebouncedQ] = useState(initialQ);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(id);
  }, [q]);

  const { data: store } = useStore(slug);
  // The same facet layer the collection page uses — one hook, so a tag or a
  // price bound narrows identically on both pages (it is literally the same URL
  // param hitting the same endpoint).
  const facets = useCatalogFacets();
  const { setParams, chips, clearAll } = facets;
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Keep `?q=` in step with the box. The facets write the URL too, so a stale
  // term would be resurrected on reload — and now that the filters live in the
  // URL, the URL is the thing a shopper copies, shares and refreshes.
  useEffect(() => {
    if ((sp.get("q") ?? "") !== debouncedQ) setParams({ q: debouncedQ || undefined });
  }, [debouncedQ, sp, setParams]);

  // Listing mode is the merchant's (Customize → Collections), shared with the
  // collection page so search doesn't paginate in a second style.
  const mode = useStoreTemplate(store, "pagination");
  const paged = mode === "pages";
  const [page, setPage] = useState(1);
  // A new term OR a changed facet is a new result set — back to page 1
  // (render-time adjust).
  const resultKey = `${debouncedQ}|${facets.filterKey}`;
  const [prevQuery, setPrevQuery] = useState(resultKey);
  if (prevQuery !== resultKey) {
    setPrevQuery(resultKey);
    setPage(1);
  }

  // Until 2026-07-31 this was a single un-paged fetch: a store with more than
  // `SEARCH_PAGE_SIZE` matches silently dropped the rest, and the results line
  // reported the truncated length as the total.
  const pagedQuery = useStoreProducts(
    slug,
    searchQueryParams(debouncedQ, facets.params, page),
    paged,
  );
  const infiniteQuery = useStoreProductsInfinite(
    slug,
    searchInfiniteParams(debouncedQ, facets.params),
    !paged,
  );
  const infinitePages = infiniteQuery.data?.pages ?? [];
  const isLoading = paged ? pagedQuery.isLoading : infiniteQuery.isLoading;
  const pagination = paged ? pagedQuery.data?.pagination : infinitePages[0]?.pagination;

  // The shopper picks grid vs list here (was an admin template). Default grid;
  // the persisted choice applies once hydrated (not via a setState-in-effect)
  // so the first client render matches the SSR HTML.
  const hydrated = useHydrated();
  const stored = useMemo<SearchView>(
    () => (hydrated && localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid"),
    [hydrated],
  );
  const [picked, setPicked] = useState<SearchView | null>(null);
  const view = picked ?? stored;
  const pickView = (v: SearchView) => {
    setPicked(v);
    localStorage.setItem(VIEW_KEY, v);
  };

  const currency = store?.currency;
  const items = paged
    ? (pagedQuery.data?.items ?? [])
    : infinitePages.flatMap((p) => p.items);
  const total = pagination?.total ?? items.length;

  return (
    <div style={wrap}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--card)", border: "1px solid var(--border-strong)", borderRadius: 10, padding: "13px 16px", marginBottom: 18, color: "var(--text)" }}>
        <Icon name="search" size={18} />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.searchPh}
          style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", color: "var(--text)", fontSize: 16, fontWeight: 500, fontFamily: "inherit" }}
        />
      </div>

      {/* The toolbar and chips render even with zero results, and that is the
          point: a shopper who over-narrows the filters must be able to widen
          them again. Inside the empty branch, the only way out would be the
          browser's back button. */}
      {isLoading ? null : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            {total} {t.results}
            {q ? ` · "${q}"` : ""}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
            <FiltersButton activeCount={chips.length} onClick={() => setDrawerOpen(true)} />
            <SortSelect sort={facets.sort} onChange={(s) => setParams({ sort: s })} />
            <div style={{ display: "flex", border: "1px solid var(--border-strong)", borderRadius: 8, overflow: "hidden" }}>
              {(["grid", "list"] as const).map((v) => {
                const active = view === v;
                const label = v === "grid" ? t.gridView : t.listView;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => pickView(v)}
                    aria-pressed={active}
                    aria-label={label}
                    title={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 36,
                      height: 32,
                      border: "none",
                      cursor: "pointer",
                      background: active ? "var(--primary)" : "var(--card)",
                      color: active ? "var(--on-primary)" : "var(--muted)",
                    }}
                  >
                    <Icon name={v} size={16} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {isLoading ? null : <FilterChips chips={chips} onClearAll={clearAll} />}

      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(var(--searchcols), minmax(0,1fr))", gap: "var(--gap)" }}>
          {Array.from({ length: 8 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "60px 30px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14, color: "var(--faint)" }}>
            <Icon name="search" size={40} />
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 6px" }}>{t.noResults}</h3>
          <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 auto 20px", maxWidth: 360 }}>{t.noResultsMsg}</p>
          {/* With filters on, "browse everything" is the wrong advice — clearing
              them is the shorter route back to results. */}
          {chips.length > 0 ? (
            <button
              type="button"
              onClick={clearAll}
              style={{ background: "var(--primary)", color: "var(--on-primary)", border: "none", padding: "12px 24px", borderRadius: 9, fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              {t.clearAll}
            </button>
          ) : (
            <Link href={storeHref(base, "/products")} style={{ display: "inline-block", background: "var(--primary)", color: "var(--on-primary)", padding: "12px 24px", borderRadius: 9, fontSize: 14, fontWeight: 600 }}>
              {t.viewAllProducts}
            </Link>
          )}
        </div>
      ) : (
        <>
          {view === "list" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map((p) => (
                <SearchRow key={p._id} product={p} currency={currency} base={base} slug={slug} addedLabel={t.added} addLabel={t.addToCart} outLabel={t.outOfStock} />
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(var(--searchcols), minmax(0,1fr))", gap: "var(--gap)" }}>
              {items.map((p) => (
                <ProductCard key={p._id} product={p} currency={currency} variant="compact" />
              ))}
            </div>
          )}

          {paged && pagination ? (
            <Pager page={pagination.page} totalPages={pagination.totalPages} onChange={setPage} />
          ) : null}

          {!paged ? (
            // Keyed on the term AND the facets, so each new result set gets its
            // own auto-load budget — see the note in load-more.tsx.
            <LoadMore
              key={resultKey}
              mode={mode === "infinite" ? "infinite" : "loadMore"}
              hasMore={infiniteQuery.hasNextPage}
              loading={infiniteQuery.isFetchingNextPage}
              onLoad={() => infiniteQuery.fetchNextPage()}
              shown={items.length}
              total={total}
            />
          ) : null}
        </>
      )}

      {/* Same panel, same drawer as the collection page — search has no sidebar
          template, so this is its only home here. */}
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
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px 16px" }}>
          <FilterPanel
            categories={facets.categories}
            brands={facets.brands}
            tags={facets.tags}
            filters={facets.filters}
            onChange={setParams}
          />
        </div>
      </SideDrawer>
    </div>
  );
}

function SearchRow({
  product,
  currency,
  base,
  slug,
  addLabel,
  addedLabel,
  outLabel,
}: {
  product: CatalogProduct;
  currency?: string;
  base: string;
  slug: string;
  addLabel: string;
  addedLabel: string;
  outLabel: string;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();
  const thumb = thumbImageUrl(product.images?.[0]);
  const pdp = storeHref(base, `/products/${product.slug}`);
  const outOfStock = product.availableQuantity <= 0;
  return (
    <div style={{ display: "flex", gap: 14, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 12, alignItems: "center" }}>
      <Link href={storeHref(base, `/products/${product.slug}`)} style={{ width: 84, height: 84, flex: "none" }}>
        <Media src={thumb} alt={product.name} radius={9} />
      </Link>
      <Link href={storeHref(base, `/products/${product.slug}`)} style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.3, margin: "0 0 6px" }}>{product.name}</div>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{money(product.price, currency)}</span>
        {/* The search term matches a product's TAGS as well as its name, so a
            row whose name contains none of the typed words is not a bug — the
            chip is the reason it is here. No `base`: this whole block is one
            <Link>, and a link inside a link is invalid markup. */}
        <ProductTagChips tags={product.tags} max={3} style={{ marginTop: 7 }} />
      </Link>
      <button
        type="button"
        disabled={outOfStock}
        onClick={() => {
          // Variable products need a variant picked on the PDP first.
          if (product.hasVariants) {
            router.push(pdp);
            return;
          }
          addItem(slug, {
            productId: product._id,
            slug: product.slug,
            name: product.name,
            price: product.price ?? 0,
            image: thumb,
            // Backorder was never considered here, so a backorder product added
            // from search used to arrive capped at its (often zero) on-hand
            // stock. `cartLineCap` is the one rule; this surface now follows it.
            maxQty: cartLineCap(
              product.availableQuantity,
              product.outOfStockBehavior === "backorder",
            ),
          });
          toast.success(addedLabel);
        }}
        style={{ flex: "none", background: "var(--primary)", color: "var(--on-primary)", border: "none", padding: "10px 18px", borderRadius: 8, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: outOfStock ? "not-allowed" : "pointer", opacity: outOfStock ? 0.55 : 1 }}
      >
        {outOfStock ? outLabel : addLabel}
      </button>
    </div>
  );
}

export default function SearchPage() {
  const { t } = useStorefrontUI();
  return (
    <Suspense fallback={<p style={{ padding: 24, fontSize: 13, color: "var(--muted)" }}>{t.loading}</p>}>
      <SearchInner />
    </Suspense>
  );
}
