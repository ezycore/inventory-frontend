"use client";
// coding-standard: maintained

import { useEffect, useRef } from "react";
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
 *
 * `href` going from set to absent means the merchant **removed** their favicon,
 * and that has to reset the tag — otherwise the tab keeps showing an image the
 * user just deleted, while the settings page says tabs now show the platform
 * icon. That is NOT the same as `href` being absent because the data has not
 * arrived yet: applying the default there would paint over the SSR-rendered
 * icon during hydration, which is the exact flash this whole hook exists to
 * avoid. The `applied` ref is what tells the two apart — reset only if we were
 * the ones showing something.
 */
export function useFaviconOverride(href?: string) {
  const pathname = usePathname();
  const applied = useRef(false);

  useEffect(() => {
    if (href) {
      applied.current = true;
      applyFavicon(href);
      return;
    }
    if (applied.current) {
      applied.current = false;
      applyFavicon(DEFAULT_ICON);
    }
  }, [href, pathname]);

  useEffect(() => () => applyFavicon(DEFAULT_ICON), []);
}
