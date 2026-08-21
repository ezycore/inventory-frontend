// coding-standard: maintained
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import {
  storefrontApi,
  type CatalogCategory,
  type CatalogProduct,
  type ContentPageLink,
  type ContentPageView,
  type PlaceOrderInput,
  type ProductListResult,
  type ShopperPrefs,
  type StoreCampaign,
  type StorefrontStore,
} from "@/lib/storefront-client";
import { useShopperStore } from "@/services/stores/use-shopper-store";

/**
 * Storefront query keys. Deliberately **separate from `services/api/query-keys.ts`**: this surface
 * has a different session model (a shopper token, not the staff JWT), a slug dimension no admin key
 * has, and SSR-seeded `initialData` — and a shopper mutation can never dirty an admin query. Folding
 * it into the admin registry would thread `slug` through a graph where nothing else needs it.
 *
 * Same invariant, though: **every key starts with `storefront.all(slug)`**, and everything private to
 * the signed-in shopper starts with `storefront.shopper(slug)`, so a session change is one eviction.
 */
export const storefront = {
  all: (slug: string) => ["storefront", slug] as const,

  // Public store data. SSR-seeded, shared by every visitor, survives a session change.
  store: (slug: string) => ["storefront", slug, "store"] as const,
  products: (slug: string, params: unknown) =>
    ["storefront", slug, "products", params ?? {}] as const,
  /**
   * The infinite variant of `products`. Separate because its params must NOT
   * contain `page` — an infinite query owns the page cursor, and folding it into
   * the key would make every page its own cache entry, i.e. exactly the
   * behaviour infinite scrolling exists to avoid. Still under the same
   * `["storefront", slug, "products"]` prefix, so one eviction covers both.
   */
  productsInfinite: (slug: string, params: unknown) =>
    ["storefront", slug, "products", "infinite", params ?? {}] as const,
  product: (slug: string, productSlug: string) =>
    ["storefront", slug, "product", productSlug] as const,
  categories: (slug: string) => ["storefront", slug, "categories"] as const,
  brands: (slug: string, params: unknown = {}) =>
    ["storefront", slug, "brands", params] as const,
  tags: (slug: string, params: unknown = {}) =>
    ["storefront", slug, "tags", params] as const,
  campaigns: (slug: string) => ["storefront", slug, "campaigns"] as const,
  pages: (slug: string) => ["storefront", slug, "pages"] as const,
  page: (slug: string, pageSlug: string) =>
    ["storefront", slug, "page", pageSlug] as const,
  /**
   * A public tracking link's order. Sits under the PUBLIC prefix, not
   * `shopper(...)`: the reader is identified by the token in the URL, not by a
   * session, so signing in or out must not evict it — and a guest, who has no
   * session at all, is the main reader.
   */
  trackedOrder: (slug: string, token: string) =>
    ["storefront", slug, "track", token] as const,

  /**
   * Everything private to the signed-in shopper. One prefix, on purpose: `clearShopperCache` drops
   * it wholesale when the session changes, so the next shopper on a shared device can never be
   * served the previous one's orders out of cache.
   */
  shopper: (slug: string) => ["storefront", slug, "shopper"] as const,
  orders: (slug: string) => ["storefront", slug, "shopper", "orders"] as const,
  order: (slug: string, orderNumber: string) =>
    ["storefront", slug, "shopper", "order", orderNumber] as const,
} as const;

/**
 * Drop everything the previous shopper could see. Called on login, register and logout.
 *
 * `removeQueries`, not `invalidateQueries`: invalidating leaves the rows in cache, and an inactive
 * query hands them back synchronously on the next mount — which on a shared phone means shopper B
 * reading shopper A's order history, addresses and phone numbers before the refetch lands. Public
 * store data is deliberately untouched: it is identical for every visitor and SSR-seeded, so
 * clearing it would only cause a flash.
 */
export const clearShopperCache = (qc: QueryClient, slug: string) =>
  qc.removeQueries({ queryKey: storefront.shopper(slug) });

// `initialData` (server-fetched in shop/layout.tsx) seeds the cache so the shell
// renders the real name/brand/logo on the FIRST paint — no "Store"→name flash.
export const useStore = (slug: string, initialData?: StorefrontStore) =>
  useQuery({
    queryKey: storefront.store(slug),
    queryFn: () => storefrontApi.getStore(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    initialData,
  });

// `initialData` (server-fetched in the collection page) puts the first page of
// results in the SSR HTML — without it a crawler sees only the skeleton grid.
// The params object IS the cache key, so callers must build it through
// `catalogQueryParams` (lib/storefront-catalog-params.ts) on both sides.
export const useStoreProducts = (
  slug: string,
  params: Record<string, string | number | undefined> = {},
  enabled = true,
  initialData?: ProductListResult,
) =>
  useQuery({
    queryKey: storefront.products(slug, params),
    queryFn: () => storefrontApi.listProducts(slug, params),
    enabled: !!slug && enabled,
    initialData,
  });

/**
 * Same endpoint as `useStoreProducts`, accumulated page by page — the store's
 * "infinite" / "load more" pagination modes.
 *
 * Two things are load-bearing:
 *
 * - **`params` must not carry `page`.** The cursor lives in `pageParam`; a
 *   `page` in the params object would change the cache key on every load and
 *   defeat the accumulation.
 * - **`initialData` is reshaped, not passed through.** The collection page seeds
 *   page 1 from the server so the listing is in the SSR HTML; an infinite query
 *   wants `{ pages, pageParams }`, and handing it a bare `ProductListResult`
 *   silently misses the seed — which puts a spinner back in the crawlable body,
 *   the exact defect the seeding exists to fix.
 */
export const useStoreProductsInfinite = (
  slug: string,
  params: Record<string, string | number | undefined> = {},
  enabled = true,
  initialData?: ProductListResult,
) =>
  useInfiniteQuery({
    queryKey: storefront.productsInfinite(slug, params),
    queryFn: ({ pageParam }) =>
      storefrontApi.listProducts(slug, { ...params, page: pageParam }),
    enabled: !!slug && enabled,
    initialPageParam: 1,
    // `undefined` ends the query — TanStack stops offering a next page, which is
    // what the UI reads as "you've reached the end".
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.totalPages
        ? last.pagination.page + 1
        : undefined,
    initialData: initialData
      ? { pages: [initialData], pageParams: [1] }
      : undefined,
  });

// `initialData` (server-fetched in the PDP's page.tsx) is what makes the product
// name, price and description part of the server-rendered HTML rather than
// something that only exists after hydration.
export const useStoreProduct = (
  slug: string,
  productSlug: string,
  initialData?: CatalogProduct,
) =>
  useQuery({
    queryKey: storefront.product(slug, productSlug),
    queryFn: () => storefrontApi.getProduct(slug, productSlug),
    enabled: !!slug && !!productSlug,
    initialData,
  });

// `initialData` (server-fetched in shop/layout.tsx) seeds the whole tree before
// anything renders. It must be seeded at the SHELL, not per page: the shell is
// the outermost consumer, so it creates this query first, and initialData passed
// by a deeper component would arrive after the query already exists and be
// ignored. Without it the header's category row, the collection page's
// sub-category strip and the PDP breadcrumb's category rungs are all absent from
// the SSR HTML — and the breadcrumb is the sharp case, because its JSON-LD twin
// IS server-built, so the two disagreed until hydration.
export const useStoreCategories = (
  slug: string,
  initialData?: CatalogCategory[],
) =>
  useQuery({
    queryKey: storefront.categories(slug),
    queryFn: () => storefrontApi.listCategories(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    initialData,
  });

/** Curated brand facet (products page filter; brand names for chips/headings). */
export const useStoreBrands = (
  slug: string,
  params: Record<string, string | number | undefined> = {},
) =>
  useQuery({
    queryKey: storefront.brands(slug, params),
    queryFn: () => storefrontApi.listBrands(slug, params),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

/** The public tag facet. Curated server-side, so an empty list means "no tags in use". */
export const useStoreTags = (
  slug: string,
  params: Record<string, string | number | undefined> = {},
) =>
  useQuery({
    queryKey: storefront.tags(slug, params),
    queryFn: () => storefrontApi.listTags(slug, params),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

// `initialData` (server-fetched in shop/layout.tsx) seeds the cache so the
// campaign strip is in the SSR HTML instead of popping in after hydration.
export const useStoreCampaigns = (slug: string, initialData?: StoreCampaign[]) =>
  useQuery({
    queryKey: storefront.campaigns(slug),
    queryFn: () => storefrontApi.listCampaigns(slug),
    enabled: !!slug,
    staleTime: 60 * 1000,
    initialData,
  });

// `initialData` (server-fetched in shop/layout.tsx) seeds the cache so footer
// page links are in the SSR HTML (SEO) instead of popping in after hydration.
export const useStorePages = (slug: string, initialData?: ContentPageLink[]) =>
  useQuery({
    queryKey: storefront.pages(slug),
    queryFn: () => storefrontApi.listPages(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    initialData,
  });

// `initialData` (server-fetched in the CMS page's page.tsx) — the body is the
// only content on that route, so without it the SSR HTML is a "Loading…" line.
export const useStorePage = (
  slug: string,
  pageSlug: string,
  initialData?: ContentPageView,
) =>
  useQuery({
    queryKey: storefront.page(slug, pageSlug),
    queryFn: () => storefrontApi.getPage(slug, pageSlug),
    enabled: !!slug && !!pageSlug,
    initialData,
  });

export const useVerifyEmail = (slug: string) =>
  useMutation({
    mutationFn: (token: string) => storefrontApi.verifyEmail(slug, token),
  });

export const useForgotPassword = (slug: string) =>
  useMutation({
    mutationFn: (email: string) => storefrontApi.forgotPassword(slug, email),
  });

/** Signed-in shopper asks for the verification link again (account banner). */
export const useResendVerification = (slug: string) => {
  const token = useShopperStore((s) => s.token);
  return useMutation({
    mutationFn: () => storefrontApi.resendVerification(slug, token!),
  });
};

export const useResetPassword = (slug: string) =>
  useMutation({
    mutationFn: (v: { token: string; password: string }) =>
      storefrontApi.resetPassword(slug, v.token, v.password),
  });

/**
 * Sign the shopper out. **Use this, never `useShopperStore().logout` directly** — clearing the token
 * without evicting leaves the previous shopper's orders in the cache, and the next sign-in on the
 * same device reads them back before its own fetch lands.
 */
export const useShopperLogout = (slug: string) => {
  const qc = useQueryClient();
  // The rule is matching its own implementation here: this function IS the
  // evicting logout it tells callers to use, so the raw store action is exactly
  // what belongs on this line — `clearShopperCache` two lines down is the half
  // the rule exists to enforce, and it is right there.
  // eslint-disable-next-line query-cache/no-raw-shopper-logout -- see above
  const logout = useShopperStore((s) => s.logout);
  return () => {
    logout();
    clearShopperCache(qc, slug);
  };
};

/** Register + login mutations that persist the shopper session on success. */
export const useShopperAuth = (slug: string) => {
  const setAuth = useShopperStore((s) => s.setAuth);
  const qc = useQueryClient();
  // Drop whatever the previous shopper on this device left behind before the new
  // session's queries can read it out of cache.
  const onSuccess = (r: { token: string; shopper: Parameters<typeof setAuth>[2] }) => {
    clearShopperCache(qc, slug);
    setAuth(slug, r.token, r.shopper);
  };

  const register = useMutation({
    mutationFn: (body: {
      name: string;
      email: string;
      password: string;
      phone?: string;
    }) => storefrontApi.register(slug, body),
    onSuccess,
  });

  const login = useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      storefrontApi.login(slug, body),
    onSuccess,
  });

  return { register, login };
};

/**
 * Account-page mutations (profile / preferences / address book). Every call
 * returns the full refreshed profile, which replaces the persisted shopper so
 * the whole storefront reflects the change immediately.
 */
export const useShopperAccount = (slug: string) => {
  const token = useShopperStore((s) => s.token);
  const setShopper = useShopperStore((s) => s.setShopper);
  const onSuccess = (shopper: Parameters<typeof setShopper>[0]) =>
    setShopper(shopper);

  const updateProfile = useMutation({
    mutationFn: (body: {
      name?: string;
      gender?: "male" | "female" | "other";
      dob?: string;
    }) => storefrontApi.updateProfile(slug, token!, body),
    onSuccess,
  });
  const updatePrefs = useMutation({
    mutationFn: (body: Partial<ShopperPrefs>) =>
      storefrontApi.updatePrefs(slug, token!, body),
    onSuccess,
  });
  const addAddress = useMutation({
    mutationFn: (body: {
      label: string;
      line: string;
      phone?: string;
      isDefault?: boolean;
      district?: string;
      area?: string;
    }) => storefrontApi.addAddress(slug, token!, body),
    onSuccess,
  });
  const updateAddress = useMutation({
    mutationFn: ({
      addressId,
      ...body
    }: {
      addressId: string;
      label?: string;
      line?: string;
      phone?: string;
      isDefault?: boolean;
      district?: string;
      area?: string;
    }) => storefrontApi.updateAddress(slug, token!, addressId, body),
    onSuccess,
  });
  const deleteAddress = useMutation({
    mutationFn: (addressId: string) =>
      storefrontApi.deleteAddress(slug, token!, addressId),
    onSuccess,
  });
  // Returns only a message (no profile change) — no setShopper needed.
  const changePassword = useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      storefrontApi.changePassword(slug, token!, body),
  });

  return {
    updateProfile,
    updatePrefs,
    addAddress,
    updateAddress,
    deleteAddress,
    changePassword,
  };
};

/** Shopper's own order history (requires a shopper session). */
export const useShopperOrders = (slug: string) => {
  const token = useShopperStore((s) => s.token);
  return useQuery({
    queryKey: storefront.orders(slug),
    queryFn: () => storefrontApi.listOrders(slug, token!),
    enabled: !!slug && !!token,
  });
};

export const useShopperOrder = (slug: string, orderNumber: string) => {
  const token = useShopperStore((s) => s.token);
  return useQuery({
    queryKey: storefront.order(slug, orderNumber),
    queryFn: () => storefrontApi.getOrder(slug, token!, orderNumber),
    enabled: !!slug && !!token && !!orderNumber,
  });
};

export const usePlaceOrder = (slug: string) => {
  const token = useShopperStore((s) => s.token);
  const qc = useQueryClient();
  return useMutation({
    // `token ?? undefined`, never `token!` — a guest legitimately has none, and
    // the server reads its absence as "guest order". Asserting it here was the
    // shape that only made sense while checkout required an account.
    mutationFn: (body: PlaceOrderInput) =>
      storefrontApi.placeOrder(slug, token ?? undefined, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: storefront.shopper(slug) }),
  });
};

/** Shopper self-cancel — only a still-pending order can be cancelled server-side. */
export const useCancelShopperOrder = (slug: string) => {
  const token = useShopperStore((s) => s.token);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderNumber: string) =>
      storefrontApi.cancelOrder(slug, token!, orderNumber),
    // One prefix covers the list and the order's own detail.
    onSuccess: () => qc.invalidateQueries({ queryKey: storefront.shopper(slug) }),
  });
};
