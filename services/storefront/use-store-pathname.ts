"use client";
// coding-standard: maintained

import { usePathname } from "next/navigation";
import { publicPathname } from "@/lib/storefront-sites";

/**
 * The current storefront pathname as the shopper's address bar spells it.
 *
 * **Storefront code reads the pathname through this, never `usePathname`.** On
 * a page served from the cached `/sites` route the server renders with the
 * rewritten URL and the browser with the public one, so anything derived from a
 * raw `usePathname()` — the active tab, the breadcrumb, whether a strip shows —
 * differs between the two renders and fails hydration. See `publicPathname`.
 */
export function useStorePathname(): string {
  return publicPathname(usePathname());
}
