// coding-standard: maintained
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  storefrontApi,
  type ContentPageLink,
  type PlaceOrderInput,
  type ShopperPrefs,
  type StoreCampaign,
  type StorefrontStore,
} from "@/lib/storefront-client";
import { useShopperStore } from "@/services/stores/use-shopper-store";

const key = (slug: string, ...rest: unknown[]) =>
  ["storefront", slug, ...rest] as const;

// `initialData` (server-fetched in shop/layout.tsx) seeds the cache so the shell
// renders the real name/brand/logo on the FIRST paint — no "Store"→name flash.
export const useStore = (slug: string, initialData?: StorefrontStore) =>
  useQuery({
    queryKey: key(slug, "store"),
    queryFn: () => storefrontApi.getStore(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    initialData,
  });

export const useStoreProducts = (
  slug: string,
  params: Record<string, string | number | undefined> = {},
  enabled = true,
) =>
  useQuery({
    queryKey: key(slug, "products", params),
    queryFn: () => storefrontApi.listProducts(slug, params),
    enabled: !!slug && enabled,
  });

export const useStoreProduct = (slug: string, productSlug: string) =>
  useQuery({
    queryKey: key(slug, "product", productSlug),
    queryFn: () => storefrontApi.getProduct(slug, productSlug),
    enabled: !!slug && !!productSlug,
  });

export const useStoreCategories = (slug: string) =>
  useQuery({
    queryKey: key(slug, "categories"),
    queryFn: () => storefrontApi.listCategories(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

// `initialData` (server-fetched in shop/layout.tsx) seeds the cache so the
// campaign strip is in the SSR HTML instead of popping in after hydration.
export const useStoreCampaigns = (slug: string, initialData?: StoreCampaign[]) =>
  useQuery({
    queryKey: key(slug, "campaigns"),
    queryFn: () => storefrontApi.listCampaigns(slug),
    enabled: !!slug,
    staleTime: 60 * 1000,
    initialData,
  });

// `initialData` (server-fetched in shop/layout.tsx) seeds the cache so footer
// page links are in the SSR HTML (SEO) instead of popping in after hydration.
export const useStorePages = (slug: string, initialData?: ContentPageLink[]) =>
  useQuery({
    queryKey: key(slug, "pages"),
    queryFn: () => storefrontApi.listPages(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
    initialData,
  });

export const useStorePage = (slug: string, pageSlug: string) =>
  useQuery({
    queryKey: key(slug, "page", pageSlug),
    queryFn: () => storefrontApi.getPage(slug, pageSlug),
    enabled: !!slug && !!pageSlug,
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

/** Register + login mutations that persist the shopper session on success. */
export const useShopperAuth = (slug: string) => {
  const setAuth = useShopperStore((s) => s.setAuth);

  const register = useMutation({
    mutationFn: (body: {
      name: string;
      email: string;
      password: string;
      phone?: string;
    }) => storefrontApi.register(slug, body),
    onSuccess: (r) => setAuth(slug, r.token, r.shopper),
  });

  const login = useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      storefrontApi.login(slug, body),
    onSuccess: (r) => setAuth(slug, r.token, r.shopper),
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
    queryKey: key(slug, "orders"),
    queryFn: () => storefrontApi.listOrders(slug, token!),
    enabled: !!slug && !!token,
  });
};

export const useShopperOrder = (slug: string, orderNumber: string) => {
  const token = useShopperStore((s) => s.token);
  return useQuery({
    queryKey: key(slug, "order", orderNumber),
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
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: key(slug, "orders") }),
  });
};
