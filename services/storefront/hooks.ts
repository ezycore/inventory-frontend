import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { storefrontApi, type PlaceOrderInput } from "@/lib/storefront-client";
import { useShopperStore } from "@/services/stores/use-shopper-store";

const key = (slug: string, ...rest: unknown[]) =>
  ["storefront", slug, ...rest] as const;

export const useStore = (slug: string) =>
  useQuery({
    queryKey: key(slug, "store"),
    queryFn: () => storefrontApi.getStore(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
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

export const useStoreCampaigns = (slug: string) =>
  useQuery({
    queryKey: key(slug, "campaigns"),
    queryFn: () => storefrontApi.listCampaigns(slug),
    enabled: !!slug,
    staleTime: 60 * 1000,
  });

export const useStorePages = (slug: string) =>
  useQuery({
    queryKey: key(slug, "pages"),
    queryFn: () => storefrontApi.listPages(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
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
