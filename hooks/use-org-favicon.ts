"use client";
// coding-standard: maintained

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/services/stores/use-auth-store";

const DEFAULT_ICON = "/icon.png";

function applyFavicon(href: string) {
  // rel*= catches "icon", "shortcut icon" and "apple-touch-icon" — anything
  // left pointing at the default would outrank the swapped icon in Chrome.
  const links = document.querySelectorAll<HTMLLinkElement>('link[rel*="icon"]');
  if (links.length === 0) {
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = href;
    document.head.appendChild(link);
    return;
  }
  for (const link of links) link.href = href;
}

/**
 * Swaps the browser-tab favicon to the signed-in organization's logo (the org
 * data lives client-side in the auth store, so this can't be server metadata).
 * Re-applies after route changes because the App Router re-renders the
 * metadata <link> tags; restores the default on unmount (logging out leaves
 * the protected layout).
 */
export function useOrgFavicon() {
  const logo = useAuthStore((s) => s.user?.organization?.logo);
  const pathname = usePathname();
  const href = logo?.thumbnailUrl || logo?.url;

  useEffect(() => {
    if (href) applyFavicon(href);
  }, [href, pathname]);

  useEffect(() => () => applyFavicon(DEFAULT_ICON), []);
}
