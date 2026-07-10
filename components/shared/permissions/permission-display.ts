// coding-standard: maintained
import {
  CheckCircle2,
  Eye,
  Pencil,
  Plus,
  Trash2,
  type LucideIcon,
} from "lucide-react";

/**
 * Display helpers for `resource.action` permission strings, shared by the
 * profile Permissions tab and the Roles settings drawer. Purely presentational
 * — the backend catalog (`easystock-backend/src/constants/permissions.ts`)
 * stays authoritative; unknown categories get a neutral fallback.
 */

export interface CategoryConfig {
  name: string;
  color: string;
  bgColor: string;
  textColor: string;
}

/** Bucket permission keys by their `category.` prefix, preserving order. */
export function groupPermissions(permissions: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  permissions.forEach((permission) => {
    const [category] = permission.split(".");
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(permission);
  });
  return groups;
}

/** Human label for a permission's action part, e.g. "products.view" → "View". */
export function formatPermission(permission: string): string {
  const [, action] = permission.split(".");
  return action
    ? action.charAt(0).toUpperCase() + action.slice(1).replace(/_/g, " ")
    : permission;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  products: {
    name: "Products",
    color: "border-blue-200 dark:border-blue-800",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    textColor: "text-blue-600 dark:text-blue-400",
  },
  categories: {
    name: "Categories",
    color: "border-purple-200 dark:border-purple-800",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    textColor: "text-purple-600 dark:text-purple-400",
  },
  brands: {
    name: "Brands",
    color: "border-pink-200 dark:border-pink-800",
    bgColor: "bg-pink-50 dark:bg-pink-950/30",
    textColor: "text-pink-600 dark:text-pink-400",
  },
  stock: {
    name: "Stock & Inventory",
    color: "border-amber-200 dark:border-amber-800",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    textColor: "text-amber-600 dark:text-amber-400",
  },
  reports: {
    name: "Reports",
    color: "border-cyan-200 dark:border-cyan-800",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
    textColor: "text-cyan-600 dark:text-cyan-400",
  },
  organization: {
    name: "Organization",
    color: "border-indigo-200 dark:border-indigo-800",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    textColor: "text-indigo-600 dark:text-indigo-400",
  },
  users: {
    name: "Users",
    color: "border-red-200 dark:border-red-800",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    textColor: "text-red-600 dark:text-red-400",
  },
  suppliers: {
    name: "Suppliers",
    color: "border-orange-200 dark:border-orange-800",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    textColor: "text-orange-600 dark:text-orange-400",
  },
  customers: {
    name: "Customers",
    color: "border-teal-200 dark:border-teal-800",
    bgColor: "bg-teal-50 dark:bg-teal-950/30",
    textColor: "text-teal-600 dark:text-teal-400",
  },
  locations: {
    name: "Locations",
    color: "border-emerald-200 dark:border-emerald-800",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    textColor: "text-emerald-600 dark:text-emerald-400",
  },
  taxes: {
    name: "Taxes",
    color: "border-violet-200 dark:border-violet-800",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    textColor: "text-violet-600 dark:text-violet-400",
  },
  units: {
    name: "Units",
    color: "border-slate-200 dark:border-slate-700",
    bgColor: "bg-slate-50 dark:bg-slate-900/30",
    textColor: "text-slate-600 dark:text-slate-400",
  },
  sales: {
    name: "Sales",
    color: "border-green-200 dark:border-green-800",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    textColor: "text-green-600 dark:text-green-400",
  },
  variants: {
    name: "Variants",
    color: "border-rose-200 dark:border-rose-800",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
    textColor: "text-rose-600 dark:text-rose-400",
  },
};

/** Display name + color classes for a category, with a neutral fallback. */
export function getCategoryConfig(category: string): CategoryConfig {
  return (
    CATEGORY_CONFIGS[category] || {
      name: category.charAt(0).toUpperCase() + category.slice(1),
      color: "border-gray-200 dark:border-gray-700",
      bgColor: "bg-gray-50 dark:bg-gray-900/30",
      textColor: "text-gray-600 dark:text-gray-400",
    }
  );
}

/** Icon + tone class for an action label (view/create/edit/delete families). */
export function getActionStyle(action: string): {
  icon: LucideIcon;
  className: string;
} {
  const lowerAction = action.toLowerCase();
  if (lowerAction.includes("create") || lowerAction.includes("add")) {
    return { icon: Plus, className: "text-green-600 dark:text-green-400" };
  }
  if (lowerAction.includes("delete") || lowerAction.includes("remove")) {
    return { icon: Trash2, className: "text-red-500 dark:text-red-400" };
  }
  if (lowerAction.includes("update") || lowerAction.includes("edit")) {
    return { icon: Pencil, className: "text-amber-600 dark:text-amber-400" };
  }
  if (
    lowerAction.includes("view") ||
    lowerAction.includes("read") ||
    lowerAction.includes("list")
  ) {
    return { icon: Eye, className: "text-blue-500 dark:text-blue-400" };
  }
  return { icon: CheckCircle2, className: "text-muted-foreground" };
}
