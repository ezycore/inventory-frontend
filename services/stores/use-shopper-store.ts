import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ShopperProfile } from "@/lib/storefront-client";

/**
 * Public shopper session — completely independent of the staff `use-auth-store`.
 * Holds the shopper JWT + profile and the store slug it belongs to. v1 keeps a
 * single active shopper session (switching stores replaces it).
 */
interface ShopperState {
  token: string | null;
  shopper: ShopperProfile | null;
  slug: string | null;
  isAuthenticated: boolean;
  setAuth: (slug: string, token: string, shopper: ShopperProfile) => void;
  setShopper: (shopper: ShopperProfile) => void;
  logout: () => void;
}

export const useShopperStore = create<ShopperState>()(
  persist(
    (set) => ({
      token: null,
      shopper: null,
      slug: null,
      isAuthenticated: false,
      setAuth: (slug, token, shopper) =>
        set({ slug, token, shopper, isAuthenticated: true }),
      setShopper: (shopper) => set({ shopper }),
      logout: () =>
        set({ token: null, shopper: null, isAuthenticated: false }),
    }),
    {
      name: "easystock-shopper",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
