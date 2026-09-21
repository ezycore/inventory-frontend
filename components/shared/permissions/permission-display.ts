// coding-standard: maintained
import {
  CheckCircle2,
  Eye,
  Pencil,
  Plus,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import type { Translator } from "@/i18n/config";

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

/**
 * Human label for everything after the category, e.g. `products.view` → "View".
 *
 * **Every segment after the first**, not just the second: the catalogue has
 * three-part keys (`storefront.orders.view`, `storefront.orders.manage`) and
 * reading only `[1]` rendered both as "Orders" — two identical, indistinguishable
 * checkboxes sitting next to each other in the role builder. Joined with "·" so
 * they read as "Orders · View" and "Orders · Manage".
 *
 * `getActionStyle` matches on substrings, so the verb still picks up its icon
 * wherever it sits in the key.
 */
export function formatPermission(permission: string): string {
  const [, ...rest] = permission.split(".");
  if (rest.length === 0) return permission;
  return rest
    .map((segment) => segment.replace(/_/g, " "))
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" · ");
}

/** Color classes per category; display names come from `settings.permissions.categories.*`. */
const CATEGORY_STYLES: Record<string, Omit<CategoryConfig, "name">> = {
  products: {
    color: "border-blue-200 dark:border-blue-800",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    textColor: "text-blue-600 dark:text-blue-400",
  },
  categories: {
    color: "border-purple-200 dark:border-purple-800",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    textColor: "text-purple-600 dark:text-purple-400",
  },
  brands: {
    color: "border-pink-200 dark:border-pink-800",
    bgColor: "bg-pink-50 dark:bg-pink-950/30",
    textColor: "text-pink-600 dark:text-pink-400",
  },
  stock: {
    color: "border-amber-200 dark:border-amber-800",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    textColor: "text-amber-600 dark:text-amber-400",
  },
  reports: {
    color: "border-cyan-200 dark:border-cyan-800",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
    textColor: "text-cyan-600 dark:text-cyan-400",
  },
  organization: {
    color: "border-indigo-200 dark:border-indigo-800",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    textColor: "text-indigo-600 dark:text-indigo-400",
  },
  users: {
    color: "border-red-200 dark:border-red-800",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    textColor: "text-red-600 dark:text-red-400",
  },
  suppliers: {
    color: "border-orange-200 dark:border-orange-800",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    textColor: "text-orange-600 dark:text-orange-400",
  },
  customers: {
    color: "border-teal-200 dark:border-teal-800",
    bgColor: "bg-teal-50 dark:bg-teal-950/30",
    textColor: "text-teal-600 dark:text-teal-400",
  },
  locations: {
    color: "border-emerald-200 dark:border-emerald-800",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    textColor: "text-emerald-600 dark:text-emerald-400",
  },
  taxes: {
    color: "border-violet-200 dark:border-violet-800",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    textColor: "text-violet-600 dark:text-violet-400",
  },
  units: {
    color: "border-slate-200 dark:border-slate-700",
    bgColor: "bg-slate-50 dark:bg-slate-900/30",
    textColor: "text-slate-600 dark:text-slate-400",
  },
  sales: {
    color: "border-green-200 dark:border-green-800",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    textColor: "text-green-600 dark:text-green-400",
  },
  variants: {
    color: "border-rose-200 dark:border-rose-800",
    bgColor: "bg-rose-50 dark:bg-rose-950/30",
    textColor: "text-rose-600 dark:text-rose-400",
  },
  tags: {
    color: "border-stone-200 dark:border-stone-700",
    bgColor: "bg-stone-50 dark:bg-stone-950/30",
    textColor: "text-stone-600 dark:text-stone-400",
  },
  discounts: {
    color: "border-neutral-200 dark:border-neutral-700",
    bgColor: "bg-neutral-50 dark:bg-neutral-950/30",
    textColor: "text-neutral-600 dark:text-neutral-400",
  },
  accounts: {
    color: "border-sky-200 dark:border-sky-800",
    bgColor: "bg-sky-50 dark:bg-sky-950/30",
    textColor: "text-sky-600 dark:text-sky-400",
  },
  transactions: {
    color: "border-sky-200 dark:border-sky-800",
    bgColor: "bg-sky-50 dark:bg-sky-950/30",
    textColor: "text-sky-600 dark:text-sky-400",
  },
  purchases: {
    color: "border-yellow-200 dark:border-yellow-800",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    textColor: "text-yellow-600 dark:text-yellow-400",
  },
  returns: {
    color: "border-fuchsia-200 dark:border-fuchsia-800",
    bgColor: "bg-fuchsia-50 dark:bg-fuchsia-950/30",
    textColor: "text-fuchsia-600 dark:text-fuchsia-400",
  },
  storefront: {
    color: "border-lime-200 dark:border-lime-800",
    bgColor: "bg-lime-50 dark:bg-lime-950/30",
    textColor: "text-lime-600 dark:text-lime-400",
  },
  roles: {
    color: "border-red-200 dark:border-red-800",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    textColor: "text-red-600 dark:text-red-400",
  },
  costs: {
    color: "border-zinc-200 dark:border-zinc-700",
    bgColor: "bg-zinc-50 dark:bg-zinc-950/30",
    textColor: "text-zinc-600 dark:text-zinc-400",
  },
};

/**
 * Display name + color classes for a category, with a neutral fallback.
 * `t` (bound to `settings.permissions`) is optional so category grouping logic
 * that only needs the color/name shape can still run without a live translator.
 */
export function getCategoryConfig(category: string, t?: Translator): CategoryConfig {
  const style = CATEGORY_STYLES[category] || {
    color: "border-gray-200 dark:border-gray-700",
    bgColor: "bg-gray-50 dark:bg-gray-900/30",
    textColor: "text-gray-600 dark:text-gray-400",
  };
  const fallbackName = category.charAt(0).toUpperCase() + category.slice(1);
  const name =
    t && CATEGORY_STYLES[category] ? t(`categories.${category}`) : fallbackName;
  return { name, ...style };
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
