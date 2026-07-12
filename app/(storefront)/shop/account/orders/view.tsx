"use client";
// coding-standard: maintained

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStoreContext } from "@/services/storefront/store-context";
import { storeHref } from "@/lib/storefront-links";

/**
 * Orders moved into the account page's sidebar sections — this route only
 * forwards old links/bookmarks to /account?tab=orders.
 */
export default function OrdersPage() {
  const { base } = useStoreContext();
  const router = useRouter();
  useEffect(() => {
    router.replace(storeHref(base, "/account?tab=orders"));
  }, [router, base]);
  return null;
}
