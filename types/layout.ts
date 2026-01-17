export type NavItem = {
  title: string;
  url: string;
  icon?: string;              // lucide icon name as string
  isActive?: boolean;
  shortcut?: string[];        // optional keyboard shortcut pair
  items?: NavItem[];          // nested children
  roles?: string[];           // optional: allowed roles for this item
  permissions?: string[];     // optional: required permissions for this item
};

