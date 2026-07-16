"use client";
// coding-standard: maintained

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const DEFAULT_ICON = "/icon.png";

// Point every `<link rel*="icon">` at `href`, mutating existing tags in place —
// never remove/re-add, which makes the browser drop to the default icon for a
// frame. rel*= also catches "shortcut icon"/"apple-touch-icon", any of which
// would otherwise outrank the swapped icon in Chrome.
function applyFavicon(href: string) {
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
 * Swap the browser-tab favicon to `href` client-side and restore the platform
 * default on unmount. Managing the icon imperatively (rather than via route
 * metadata) is what avoids the flicker: an async `generateMetadata` icon
 * re-resolves on every router-integrated navigation — including `history`
 * replaceState (which Next syncs into the router, e.g. the account tab switch) —
 * and flashes the parent default before the real icon loads. Re-asserts on
 * pathname change as a belt-and-braces guard. No-op until `href` is known.
 */
export function useFaviconOverride(href?: string) {
  const pathname = usePathname();

  useEffect(() => {
    if (href) applyFavicon(href);
  }, [href, pathname]);

  useEffect(() => () => applyFavicon(DEFAULT_ICON), []);
}
