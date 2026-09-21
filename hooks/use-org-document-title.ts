"use client";
// coding-standard: maintained

import { BRAND } from "@/constants/brand";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useIsomorphicLayoutEffect } from "@/hooks/use-isomorphic-layout-effect";
import { useAuthStore } from "@/services/stores/use-auth-store";

/**
 * Keeps the browser-tab title as `"<Page> · <Organization>"` for the signed-in
 * workspace — "Products · ZeroDrop" rather than the platform default.
 *
 * Page first: tabs truncate from the right, and the org name is identical in
 * every tab of a workspace, so the page name is the only part that tells two
 * tabs apart. The org suffix earns its place for anyone running more than one
 * workspace, and falls back to the product brand when no org is loaded.
 *
 * Written imperatively rather than through route metadata for the same reason
 * as `useFaviconOverride`: the organization lives in the persisted client auth
 * store, which a server `generateMetadata` cannot read.
 *
 * The page name is the **last breadcrumb**, so it is already the sidebar's
 * label for the route and already translated (`layout.nav.items.*`) — the tab
 * follows the UI language for free, and a renamed nav item renames the tab.
 *
 * Restores the default on unmount (logging out leaves the protected layout).
 * That restore is load-bearing, not tidiness: Next owns the `<title>` element,
 * and every route resolves to the same root metadata, so React sees no change
 * on navigation and would never repaint over a title we mutated behind its back.
 *
 * The same ownership is why the effect below re-asserts through a
 * `MutationObserver` rather than assigning once. On the FIRST document load
 * Next renders its metadata `<title>` while hydrating — i.e. *after* this effect
 * has already run — and replaces the tag we just wrote. A plain assignment
 * therefore survived client-side navigation but was silently reverted by every
 * fresh load and every refresh, which is the state this shipped in until it was
 * caught in a browser. Observing `<head>` wins regardless of when Next writes,
 * and the equality check keeps it from looping against itself.
 *
 * Nothing competes for the tag on navigation, and that is a precondition, not a
 * detail: Next re-asserts root metadata on every client-side navigation, so
 * while the root layout carried a `title` this hook lost the tab to
 * `BRAND.documentTitle` for a frame on every sidebar click. The shared admin root
 * (`components/layout/admin-root-layout.tsx`) has no title now — `ProtectedShell`
 * renders its own constant `<title>` — so the only
 * writer here is this hook. Restoring a metadata title above `(protected)`
 * brings the flash back.
 *
 * The effects run **before paint** (`useIsomorphicLayoutEffect`) so the tab is
 * never painted with a stale value between mount and correction.
 */
export function useOrgDocumentTitle() {
  const crumbs = useBreadcrumbs();
  const orgName = useAuthStore((s) => s.user?.organization?.name);

  const page = crumbs[crumbs.length - 1]?.title;
  const owner = orgName || BRAND.name;

  useIsomorphicLayoutEffect(() => {
    const desired = page ? `${page} · ${owner}` : owner;

    const apply = () => {
      if (document.title !== desired) document.title = desired;
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [page, owner]);

  useIsomorphicLayoutEffect(() => () => {
    document.title = BRAND.documentTitle;
  }, []);
}
