// coding-standard: maintained
import { NavItem } from "@/types/layout";
import { OrganizationFeatures } from "@/types";
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
    .map((item) => {
      // Recursively filter nested items
      if (item.items && item.items.length > 0) {
        return {
          ...item,
          items: filterNavItems(item.items, userRole, userPermissions, features),
        };
      }
      return item;
    })
    .filter((item) => {
      // Remove parent items that have no children after filtering
      // (only if they originally had children)
      if (item.items !== undefined && item.items.length === 0) {
        // Check if the parent itself has a valid URL (not just '#')
        if (item.url === "#") {
          return false;
        }
      }
      return true;
    });
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
