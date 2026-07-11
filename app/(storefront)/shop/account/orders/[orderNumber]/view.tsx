"use client";
// coding-standard: maintained

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStoreContext } from "@/services/storefront/store-context";
import { storeHref } from "@/lib/storefront-links";

/**
 * Order tracking moved into the account page (Orders → View details) — this
 * route forwards deep links (checkout "Track this order", SMS links) to
 * /account?tab=tracking&order={orderNumber}.
 */
export default function OrderTrackingPage() {
  const { base } = useStoreContext();
  const router = useRouter();
  const orderNumber = String(useParams().orderNumber);
  useEffect(() => {
    router.replace(
      storeHref(base, `/account?tab=tracking&order=${encodeURIComponent(orderNumber)}`),
    );
  }, [router, base, orderNumber]);
  return null;
}
