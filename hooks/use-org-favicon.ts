"use client";
// coding-standard: maintained

import { useAuthStore } from "@/services/stores/use-auth-store";
import { useFaviconOverride } from "@/hooks/use-favicon-override";

/**
 * Swaps the browser-tab favicon to the signed-in organization's logo (the org
 * data lives client-side in the auth store, so this can't be server metadata).
 * Restores the default on unmount (logging out leaves the protected layout).
 */
export function useOrgFavicon() {
  const logo = useAuthStore((s) => s.user?.organization?.logo);
  useFaviconOverride(logo?.thumbnailUrl || logo?.url);
}
