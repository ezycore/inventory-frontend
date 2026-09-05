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
};

// A labeled sidebar section (e.g. "Operations") holding top-level nav items.
export type NavGroup = {
  label: string;
  items: NavItem[];
};
