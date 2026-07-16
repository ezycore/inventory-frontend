import type { CatalogProduct } from "@/services/api";

/**
 * Why a product can't appear online even when "Listed". The public store only
 * serves active products (variable products sell per-variant via the PDP
 * variant selector). Returns null if it can appear.
 */
export function onlineBlockReason(p: CatalogProduct): string | null {
  if (p.status !== "active") return `${p.status} — won't show online`;
  return null;
}
