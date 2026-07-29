// coding-standard: maintained
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import {
  storefrontApi,
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
  product: (slug: string, productSlug: string) =>
    ["storefront", slug, "product", productSlug] as const,
  categories: (slug: string) => ["storefront", slug, "categories"] as const,
  brands: (slug: string) => ["storefront", slug, "brands"] as const,
  campaigns: (slug: string) => ["storefront", slug, "campaigns"] as const,
  pages: (slug: string) => ["storefront", slug, "pages"] as const,
  page: (slug: string, pageSlug: string) =>
    ["storefront", slug, "page", pageSlug] as const,

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

export const useStoreCategories = (slug: string) =>
  useQuery({
    queryKey: storefront.categories(slug),
    queryFn: () => storefrontApi.listCategories(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

/** Curated brand facet (products page filter; brand names for chips/headings). */
export const useStoreBrands = (slug: string) =>
  useQuery({
    queryKey: storefront.brands(slug),
    queryFn: () => storefrontApi.listBrands(slug),
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
    mutationFn: (body: PlaceOrderInput) =>
      storefrontApi.placeOrder(slug, token!, body),
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
