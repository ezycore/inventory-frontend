"use client";
// coding-standard: maintained

import { useAuthStore } from "@/services/stores/use-auth-store";
import { useFaviconOverride } from "@/hooks/use-favicon-override";

/**
 * Swaps the browser-tab favicon to the signed-in organization's favicon (the org
 * data lives client-side in the auth store, so this can't be server metadata).
 * Restores the default on unmount (logging out leaves the protected layout).
 *
 * Reads `favicon` and nothing else. It deliberately does NOT fall back to the
 * org logo: the two are separate uploads because they are separate jobs, and a
 * wordmark logo cover-cropped to the 200x200 thumbnail renders in the tab as an
 * unreadable middle slice. An org with no favicon gets the platform mark, which
 * is the honest answer rather than a mangled one. Same rule on the storefront.
 */
export function useOrgFavicon() {
  const favicon = useAuthStore((s) => s.user?.organization?.favicon);
  useFaviconOverride(favicon?.thumbnailUrl || favicon?.url);
}
