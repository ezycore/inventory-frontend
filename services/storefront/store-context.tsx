"use client";

import { createContext, useContext, type ReactNode } from "react";

type StoreContextValue = {
  /** Active store slug (used for data hooks + cart scoping). */
  slug: string;
  /** Public link base for this host: `/shop` on tenant hosts, `""` at a custom-domain root. */
  base: string;
};

const StoreContext = createContext<StoreContextValue>({
  slug: "",
  base: "/shop",
});

/**
 * Makes the active store's `slug` + public link `base` available to client
 * storefront components. The values are resolved on the server (from the host,
 * via `proxy.ts` headers) and injected by `shop/layout.tsx`, so client pages no
 * longer depend on a `[slug]` route param.
 */
export function StoreContextProvider({
  slug,
  base,
  children,
}: {
  slug: string;
  base: string;
  children: ReactNode;
}) {
  return (
    <StoreContext.Provider value={{ slug, base }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStoreContext = () => useContext(StoreContext);
