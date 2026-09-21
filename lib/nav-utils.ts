// coding-standard: maintained
import { NavGroup, NavItem } from "@/types/layout";
import { FeatureName, OrganizationFeatures } from "@/types";
import { navGroups } from "@/constants/navItem";
import { areAllFeaturesEnabled, isAnyFeatureEnabled, isFeatureOn } from "./feature-utils";

/**
 * Message key for a nav title/group label under `layout.nav.*` — kebab-cased
 * title ("Receipt & Print" → "receipt-print"). Nav items are keyed by title,
 * not URL, because parents and their first child often share a URL. Callers
 * fall back to the English title when the key is missing (docs/I18N.md).
 */
export function navLabelKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Filter navigation items based on user role, permissions, and enabled features
 */
export function filterNavItems(
  items: NavItem[],
  userRole: string,
  userPermissions: string[],
  features: OrganizationFeatures | undefined
): NavItem[] {
  return items
    .filter((item) => {
      // Check role restrictions
      if (item.roles && item.roles.length > 0) {
        if (!item.roles.includes(userRole)) {
          return false;
        }
      }

      // Check permission restrictions
      if (item.permissions && item.permissions.length > 0) {
        const hasPermission = item.permissions.some((permission) =>
          userPermissions.includes(permission)
        );
        if (!hasPermission) {
          return false;
        }
      }

      // Check feature restrictions (all features must be enabled)
      if (item.features && item.features.length > 0) {
        if (!areAllFeaturesEnabled(features, item.features)) {
          return false;
        }
      }

      // Check anyFeatures restrictions (at least one feature must be enabled)
      if (item.anyFeatures && item.anyFeatures.length > 0) {
        if (!isAnyFeatureEnabled(features, item.anyFeatures)) {
          return false;
        }
      }

      return true;
    })
    .flatMap((item) => {
      // Leaves pass through untouched. `items: []` in the source means "leaf"
      // (Dashboard, Customers, Suppliers all declare it) — only a list that
      // *had* entries and lost them all is an emptied parent.
      if (!item.items || item.items.length === 0) return [item];

      const children = filterNavItems(
        item.items,
        userRole,
        userPermissions,
        features
      );

      // Every child denied → the parent is a row leading somewhere the user
      // cannot use, so drop it. This used to apply only when the parent's url
      // was "#", which left real-URL parents (e.g. "Cash & Bank" → /accounts)
      // rendering as dead rows once their children were gated off.
      if (children.length === 0) return [];

      return [{ ...item, items: children }];
    });
}

/**
 * The permissions a route needs, read off the nav table that already declares
 * them.
 *
 * The sidebar and the page must agree about who may open a screen. Before this
 * they disagreed in the worst direction: `/reports/sales` was offered to a
 * `staff` user, the API answered 403, and the page rendered **"No data
 * available"** — which reads as *this shop made no sales*, not *this is not
 * yours to see*. Deriving both from one table means a gate can never be added
 * to the menu and forgotten on the screen.
 *
 * Matches the longest declared `url` that prefixes `pathname`, so a child route
 * (`/reports/expiry`, gated on `stock.view`) wins over its section
 * (`/reports`, gated on `reports.view`). Returns `undefined` for a route the
 * table does not gate — the caller should let those through.
 *
 * **On an exact tie the deeper entry wins**, and that is load-bearing rather
 * than arbitrary. A section parent and its first child routinely share a URL
 * (`/products`, `/inventory`, `/sales`), and the two declare different things:
 * the parent lists the *union* of its children, because it is a container that
 * must appear if any one child is reachable, while the child lists what that
 * one screen actually needs. Taking the parent here would hand the route guard
 * the union — letting someone with only `units.view` open `/products/:id/edit`.
 * Children are visited after their parent, so `>=` keeps the leaf.
 */
export function permissionsForPath(
  pathname: string,
  groups: NavGroup[] = navGroups,
): string[] | undefined {
  let best: { url: string; permissions: string[] } | undefined;

  const visit = (items: NavItem[]) => {
    for (const item of items) {
      const url = item.url;
      if (
        url &&
        url !== "#" &&
        item.permissions?.length &&
        (pathname === url || pathname.startsWith(`${url}/`)) &&
        (!best || url.length >= best.url.length)
      ) {
        best = { url, permissions: item.permissions };
      }
      if (item.items?.length) visit(item.items);
    }
  };
  for (const group of groups) visit(group.items);

  return best?.permissions;
}

/**
 * The feature gate a route sits behind, accumulated down the nav tree.
 *
 * Every key in `all` must be enabled; each group in `anyOf` needs at least one — the
 * two shapes `NavItem` already declares, kept apart because they mean different
 * things and collapsing them would silently loosen a gate.
 */
export type RouteFeatureGate = {
  all: FeatureName[];
  anyOf: FeatureName[][];
};

/**
 * The features a route needs, read off the same nav table the sidebar filters on.
 *
 * The sibling of `permissionsForPath`, and it exists for the same reason: the
 * menu and the screen must agree. Without it a merchant whose plan withholds a
 * capability can still reach the URL — from a bookmark, a stale tab, a link in
 * an email — and the page fires its request, collects a `FEATURE_*_DISABLED`
 * 403, and renders a generic error toast. That is the "wall instead of an
 * upsell" the launch-plan seed refused to sell against; deriving the gate here
 * is what turns it back into an offer.
 *
 * **Accumulated along the ancestor chain, not just the longest match** — and
 * that is the one real difference from `permissionsForPath`. `filterNavItems`
 * drops a whole subtree when a parent's feature check fails, so a child under
 * "Online Store" is storefront-gated whether or not it repeats the declaration.
 * Today every child does repeat it, so a leaf-only rule would give the same
 * answers; it would also break the first time someone adds a child and trusts
 * the parent. Permissions cannot work this way — there a parent lists the
 * *union* of its children and inheriting it would grant too much — which is
 * why these two functions look similar and are not.
 */
export function featuresForPath(
  pathname: string,
  groups: NavGroup[] = navGroups,
): RouteFeatureGate | undefined {
  let best: { url: string; gate: RouteFeatureGate } | undefined;

  const visit = (items: NavItem[], inherited: RouteFeatureGate) => {
    for (const item of items) {
      const gate: RouteFeatureGate = {
        all: item.features?.length
          ? [...new Set([...inherited.all, ...item.features])]
          : inherited.all,
        anyOf: item.anyFeatures?.length
          ? [...inherited.anyOf, item.anyFeatures]
          : inherited.anyOf,
      };
      const url = item.url;
      if (
        url &&
        url !== "#" &&
        (pathname === url || pathname.startsWith(`${url}/`)) &&
        (gate.all.length > 0 || gate.anyOf.length > 0) &&
        // Same tie rule as `permissionsForPath`: children are visited after
        // their parent, so `>=` keeps the leaf on a shared URL.
        (!best || url.length >= best.url.length)
      ) {
        best = { url, gate };
      }
      if (item.items?.length) visit(item.items, gate);
    }
  };
  for (const group of groups) visit(group.items, { all: [], anyOf: [] });

  return best?.gate;
}

/**
 * Does the screen at this path only READ what is already recorded?
 *
 * The frontend half of `requireFeatureForWrites`. Those routers let GET through
 * on a closed feature precisely so a downgrade cannot orphan the records made
 * while the capability was on, and a feature gate that locks the screen anyway
 * throws that away — the data is still served, still owned, and no longer has a
 * page to appear on. `inventory.routes.ts` names the case in as many words: "a
 * blanket gate would put a year of movements out of reach".
 *
 * Matched by longest URL like the gates themselves, and NOT inherited: a
 * section is read-only only if the leaf says so. Inheriting would be the same
 * mistake in the other direction — "Purchase History" being read-only tells you
 * nothing about "New Purchase" beside it.
 */
export function isReadOnlyRoute(
  pathname: string,
  groups: NavGroup[] = navGroups,
): boolean {
  let best: { url: string; readOnly: boolean } | undefined;

  const visit = (items: NavItem[]) => {
    for (const item of items) {
      const url = item.url;
      if (
        url &&
        url !== "#" &&
        (pathname === url || pathname.startsWith(`${url}/`)) &&
        (!best || url.length >= best.url.length)
      ) {
        best = { url, readOnly: !!item.readOnly };
      }
      if (item.items?.length) visit(item.items);
    }
  };
  for (const group of groups) visit(group.items);

  return !!best?.readOnly;
}

/**
 * Which features are missing for this gate — the ones a locked screen names.
 *
 * An unsatisfied `anyOf` group contributes every option in it, because any one
 * of them opens the screen and the merchant should be told all their routes in
 * rather than an arbitrary pick.
 */
export function unmetRouteFeatures(
  gate: RouteFeatureGate | undefined,
  features: OrganizationFeatures | undefined,
): FeatureName[] {
  if (!gate || !features) return [];
  const missing = gate.all.filter((f) => !isFeatureOn(features, f));
  for (const group of gate.anyOf) {
    if (!group.some((f) => isFeatureOn(features, f))) missing.push(...group);
  }
  return [...new Set(missing)];
}

/**
 * Get flat list of all nav items (for search/command palette)
 */
export function flattenNavItems(items: NavItem[]): NavItem[] {
  return items.reduce<NavItem[]>((acc, item) => {
    acc.push(item);
    if (item.items && item.items.length > 0) {
      acc.push(...flattenNavItems(item.items));
    }
    return acc;
  }, []);
}

/**
 * Find a nav item by URL
 */
export function findNavItemByUrl(
  items: NavItem[],
  url: string
): NavItem | undefined {
  for (const item of items) {
    if (item.url === url) {
      return item;
    }
    if (item.items && item.items.length > 0) {
      const found = findNavItemByUrl(item.items, url);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}
