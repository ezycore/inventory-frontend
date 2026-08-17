// coding-standard: maintained
import { NavGroup, NavItem } from "@/types/layout";
import { OrganizationFeatures } from "@/types";
import { navGroups } from "@/constants/navItem";
import { areAllFeaturesEnabled, isAnyFeatureEnabled } from "./feature-utils";

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
