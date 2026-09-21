"use client";
// coding-standard: maintained

import { useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { ordersPausedOf, type OrdersPaused } from "@/lib/storefront-orders-paused";

/** Whether this store has paused online orders, from the seeded store query. See `ordersPausedOf`. */
export function useOrdersPaused(): OrdersPaused | null {
  const { slug } = useStoreContext();
  const { data: store } = useStore(slug);
  return ordersPausedOf(store);
}
