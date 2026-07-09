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
};

// A labeled sidebar section (e.g. "Operations") holding top-level nav items.
export type NavGroup = {
  label: string;
  items: NavItem[];
};
