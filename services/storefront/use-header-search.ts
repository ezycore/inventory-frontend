"use client";
// coding-standard: maintained

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { collectionHref, storeHref } from "@/lib/storefront-links";
import { useStore, useStoreProducts } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorePathname } from "@/services/storefront/use-store-pathname";
import type { CatalogCategory, CatalogProduct } from "@/lib/storefront-client";

const RESULT_LIMIT = 6;
const RECENTS_LIMIT = 5;
const DEBOUNCE_MS = 300;
const recentsKey = (slug: string) => `sf-recent-${slug}`;

function readRecents(slug: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(recentsKey(slug)) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string").slice(0, RECENTS_LIMIT)
      : [];
  } catch {
    return [];
  }
}
function persistRecents(slug: string, list: string[]) {
  try {
    localStorage.setItem(recentsKey(slug), JSON.stringify(list.slice(0, RECENTS_LIMIT)));
  } catch {
    /* private mode / quota — recents are best-effort */
  }
}

/** A keyboard-navigable row in the results list: a product, or the "view all" CTA. */
export type SearchAction =
  | { kind: "product"; product: CatalogProduct }
  | { kind: "viewAll" };

/**
 * Header typeahead controller — shared by every search anchor (the classic
 * bar, the minimal/centered expand layer, the mobile sheet). Owns the query,
 * its debounced fetch, recent-search memory, and keyboard navigation; the
 * caller owns whether its surface is `open` (passed in so a closed panel never
 * fetches) and passes `onClose` so a commit or Escape can dismiss it. Reuses
 * the same `useStoreProducts` hook (and cache) the full /search page uses — no
 * backend change.
 */
type SearchCloseReason = "dismiss" | "navigate";
type SearchNavigationMode = "replace" | void;

export function useHeaderSearch(
  onClose: (reason: SearchCloseReason) => SearchNavigationMode,
  open: boolean,
) {
  const { slug, base } = useStoreContext();
  const router = useRouter();
  const pathname = useStorePathname();

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [active, setActive] = useState(-1);
  // Recents seed from localStorage via a lazy initializer — client-only (SSR
  // has no window, so readRecents returns []), and they render only once the
  // panel is open (post-hydration), so the SSR/client seed difference never
  // reaches the DOM. slug is stable for a mounted store, so no re-read needed.
  const [recents, setRecents] = useState<string[]>(() => readRecents(slug));

  // A committed search shouldn't linger in the header after you leave. The
  // header never unmounts across routes, so clear the input on any navigation
  // to a page other than the search results page (which keeps the term the
  // shopper just searched, matching that page's own input). Done during render
  // via the "store previous value" pattern rather than a setState-in-effect.
  const searchPath = storeHref(base, "/search");
  const [navPath, setNavPath] = useState(pathname);
  if (navPath !== pathname) {
    setNavPath(pathname);
    if (pathname !== searchPath) setQ("");
  }

  // One request per pause in typing instead of one per keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [q]);

  const { data: store } = useStore(slug);
  const { data, isLoading } = useStoreProducts(
    slug,
    { q: debouncedQ || undefined, limit: RESULT_LIMIT },
    open && debouncedQ.length > 0,
  );

  const hasQuery = q.trim().length > 0;
  // Memoized so its reference is stable across renders (react-query keeps
  // data?.items stable via structural sharing) — otherwise the `actions` memo
  // below, which lists `items` as a dependency, would recompute every render.
  const items = useMemo<CatalogProduct[]>(
    () => (hasQuery ? data?.items ?? [] : []),
    [hasQuery, data?.items],
  );
  const total = data?.pagination.total ?? items.length;
  // While the debounce catches up (or the fetch is in flight) show skeletons,
  // never a premature "no results".
  const loading = hasQuery && (isLoading || q.trim() !== debouncedQ);

  const actions = useMemo<SearchAction[]>(() => {
    if (!hasQuery || loading || items.length === 0) return [];
    return [
      ...items.map((product) => ({ kind: "product" as const, product })),
      { kind: "viewAll" as const },
    ];
  }, [hasQuery, loading, items]);

  // Drop the highlight whenever the resolved result set changes under the
  // cursor — again via the "store previous value" render pattern, not an effect.
  const [activeQ, setActiveQ] = useState(debouncedQ);
  if (activeQ !== debouncedQ) {
    setActiveQ(debouncedQ);
    setActive(-1);
  }

  const remember = (term: string) => {
    const next = [term, ...recents.filter((r) => r.toLowerCase() !== term.toLowerCase())].slice(
      0,
      RECENTS_LIMIT,
    );
    setRecents(next);
    persistRecents(slug, next);
  };

  const goSearchPage = (term = q) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    remember(trimmed);
    const mode = onClose("navigate");
    router[mode === "replace" ? "replace" : "push"](
      storeHref(base, `/search?q=${encodeURIComponent(trimmed)}`),
    );
  };
  const goProduct = (product: CatalogProduct) => {
    const mode = onClose("navigate");
    router[mode === "replace" ? "replace" : "push"](
      storeHref(base, `/products/${product.slug}`),
    );
  };
  // A collection is addressed by its PATH (`/phones`, `/phones/accessories`), so
  // the chip takes the whole category, not an id. The `?categoryId=` form this
  // used to push still resolves, but it is `noindex` and canonicalizes elsewhere
  // — navigating a shopper to a URL the store itself disclaims.
  const goCategory = (category: CatalogCategory) => {
    const mode = onClose("navigate");
    router[mode === "replace" ? "replace" : "push"](
      collectionHref(base, category),
    );
  };
  const runAction = (action: SearchAction) =>
    action.kind === "product" ? goProduct(action.product) : goSearchPage();

  const applyRecent = (term: string) => {
    setQ(term);
    setActive(-1);
  };
  const clearRecents = () => {
    setRecents([]);
    persistRecents(slug, []);
  };
  const clear = () => {
    setQ("");
    setActive(-1);
  };

  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose("dismiss");
    } else if (e.key === "ArrowDown" && actions.length) {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, actions.length - 1));
    } else if (e.key === "ArrowUp" && actions.length) {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && actions[active]) runAction(actions[active]);
      else goSearchPage();
    }
  };

  return {
    q,
    setQ,
    clear,
    hasQuery,
    loading,
    items,
    total,
    currency: store?.currency,
    recents,
    applyRecent,
    clearRecents,
    active,
    setActive,
    goProduct,
    goCategory,
    goSearchPage,
    onInputKeyDown,
  };
}

export type HeaderSearchController = ReturnType<typeof useHeaderSearch>;
