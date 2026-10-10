// coding-standard: maintained
import { FeatureName } from "@/types";

export type NavItem = {
  title: string;
  url: string;
  icon?: string; // lucide icon name as string
  isActive?: boolean;
  shortcut?: string[]; // optional keyboard shortcut pair
  items?: NavItem[]; // nested children
  roles?: string[]; // optional: allowed roles for this item
  permissions?: string[]; // optional: required permissions for this item
  features?: FeatureName[]; // optional: required features for this item (all must be enabled)
  anyFeatures?: FeatureName[]; // optional: any of these features must be enabled
  /**
   * This screen only READS records already made, so a closed feature gate must
   * not lock it — the frontend mirror of `requireFeatureForWrites` on the
   * backend, which lets GET/HEAD/OPTIONS through on the same routes.
   *
   * The case that decides it is the downgrade. A workspace that tracked stock
   * for a year and switched it off still owns those movements, and a blanket
   * gate puts a year of them out of reach — losing a capability stops new
   * activity, it never rewrites history. The item stays hidden from the sidebar
   * either way; this only keeps the URL open.
   *
   * Set it only where the backend agrees. A route whose router uses the plain
   * `requireFeature` 403s its reads too, and marking it here would trade a
   * locked screen for an empty one — which reads as "you have no records"
   * rather than "this is not part of your plan".
   */
  readOnly?: boolean;
  /**
   * Stays in the menu for a shop that has COUNTER history (`posUsedAt`) even
   * after its POS module is switched off, although its feature gate is closed —
   * losing a module never hides records already made
   * (docs/plan/orders-first-storefront.md D1/D4). Pair with `readOnly`.
   */
  keepWithPosHistory?: boolean;
  /**
   * The title to show when the POS (`sales`) module is off. "Sale" is POS
   * vocabulary: a storefront-only seller's "Sales" menu is their orders.
   */
  titleWithoutPos?: string;
  /**
   * Kept out of the sidebar and command palette, but still read by the route
   * guard (`permissionsForPath` / `featuresForPath`) — so the screen stays
   * reachable by URL with its own gates rather than inheriting the parent's
   * looser union.
   */
  hideInMenu?: boolean;
  /** Menu links open this route in a new browser tab (the POS counter). */
  openInNewTab?: boolean;
};

// A labeled sidebar section (e.g. "Operations") holding top-level nav items.
export type NavGroup = {
  label: string;
  /**
   * A different heading while a feature is OFF — the "Stock" group holds only Products when the
   * business does not count stock (G9). Resolved by `navGroupLabel`.
   */
  labelWhenOff?: { feature: FeatureName; label: string };
  items: NavItem[];
};
