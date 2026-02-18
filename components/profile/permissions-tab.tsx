"use client";

import { Badge } from "@/ui/components/badge";
import { useAuthStore } from "@/services/stores/use-auth-store";
import {
  Shield,
  CheckCircle2,
  Eye,
  Plus,
  Pencil,
  Trash2,
  Lock,
  Layers,
} from "lucide-react";
import { cn } from "@/ui/lib/utils";

// Group permissions by category
const groupPermissions = (permissions: string[]) => {
  const groups: Record<string, string[]> = {};

  permissions.forEach((permission) => {
    const [category] = permission.split(".");
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(permission);
  });

  return groups;
};

// Format permission for display
const formatPermission = (permission: string) => {
  const [, action] = permission.split(".");
  return action
    ? action.charAt(0).toUpperCase() + action.slice(1).replace(/_/g, " ")
    : permission;
};

// Get category display config with icons
const getCategoryConfig = (
  category: string
): { name: string; color: string; bgColor: string; textColor: string } => {
  const configs: Record<
    string,
    { name: string; color: string; bgColor: string; textColor: string }
  > = {
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
  return (
    configs[category] || {
      name: category.charAt(0).toUpperCase() + category.slice(1),
      color: "border-gray-200 dark:border-gray-700",
      bgColor: "bg-gray-50 dark:bg-gray-900/30",
      textColor: "text-gray-600 dark:text-gray-400",
    }
  );
};

// Get action icon and styling
const getActionStyle = (action: string) => {
  const lowerAction = action.toLowerCase();
  if (lowerAction.includes("create") || lowerAction.includes("add")) {
    return {
      icon: Plus,
      className: "text-green-600 dark:text-green-400",
    };
  }
  if (lowerAction.includes("delete") || lowerAction.includes("remove")) {
    return {
      icon: Trash2,
      className: "text-red-500 dark:text-red-400",
    };
  }
  if (lowerAction.includes("update") || lowerAction.includes("edit")) {
    return {
      icon: Pencil,
      className: "text-amber-600 dark:text-amber-400",
    };
  }
  if (lowerAction.includes("view") || lowerAction.includes("read") || lowerAction.includes("list")) {
    return {
      icon: Eye,
      className: "text-blue-500 dark:text-blue-400",
    };
  }
  return {
    icon: CheckCircle2,
    className: "text-muted-foreground",
  };
};

export function PermissionsTab() {
  const { user } = useAuthStore();
  const permissions = user?.permissions || [];
  const groupedPermissions = groupPermissions(permissions);

  const totalPermissions = permissions.length;
  const totalCategories = Object.keys(groupedPermissions).length;

  // Calculate permission breakdown
  const breakdown = permissions.reduce(
    (acc, perm) => {
      const action = perm.split(".")[1]?.toLowerCase() || "";
      if (action.includes("create") || action.includes("add")) acc.create++;
      else if (action.includes("delete") || action.includes("remove"))
        acc.delete++;
      else if (action.includes("update") || action.includes("edit"))
        acc.update++;
      else if (action.includes("view") || action.includes("read") || action.includes("list"))
        acc.view++;
      else acc.other++;
      return acc;
    },
    { view: 0, create: 0, update: 0, delete: 0, other: 0 }
  );

  if (totalPermissions === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No Permissions Assigned</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          Your account doesn&apos;t have any specific permissions. Contact your
          administrator to request access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="col-span-2 sm:col-span-2 rounded-xl border bg-gradient-to-br from-primary/10 to-primary/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalPermissions}</p>
              <p className="text-xs text-muted-foreground">Total Permissions</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-3 flex items-center gap-2">
          <Eye className="h-4 w-4 text-blue-500" />
          <div>
            <p className="text-lg font-semibold">{breakdown.view}</p>
            <p className="text-xs text-muted-foreground">View</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-3 flex items-center gap-2">
          <Plus className="h-4 w-4 text-green-500" />
          <div>
            <p className="text-lg font-semibold">{breakdown.create}</p>
            <p className="text-xs text-muted-foreground">Create</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-3 flex items-center gap-2">
          <Pencil className="h-4 w-4 text-amber-500" />
          <div>
            <p className="text-lg font-semibold">{breakdown.update}</p>
            <p className="text-xs text-muted-foreground">Update</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-3 flex items-center gap-2">
          <Trash2 className="h-4 w-4 text-red-500" />
          <div>
            <p className="text-lg font-semibold">{breakdown.delete}</p>
            <p className="text-xs text-muted-foreground">Delete</p>
          </div>
        </div>
      </div>

      {/* Categories Header */}
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Layers className="h-4 w-4" />
        <span>{totalCategories} Access Categories</span>
      </div>

      {/* Permissions Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(groupedPermissions).map(([category, perms]) => {
          const config = getCategoryConfig(category);

          return (
            <div
              key={category}
              className={cn(
                "rounded-xl border-2 overflow-hidden transition-colors",
                config.color
              )}
            >
              {/* Category Header */}
              <div
                className={cn(
                  "px-4 py-3 flex items-center justify-between",
                  config.bgColor
                )}
              >
                <span className={cn("font-semibold text-sm", config.textColor)}>
                  {config.name}
                </span>
                <Badge
                  variant="secondary"
                  className="text-xs tabular-nums h-5 px-2"
                >
                  {perms.length}
                </Badge>
              </div>

              {/* Permissions List */}
              <div className="p-3 bg-card/50 space-y-1.5">
                {perms.map((permission) => {
                  const action = formatPermission(permission);
                  const style = getActionStyle(action);
                  const Icon = style.icon;

                  return (
                    <div
                      key={permission}
                      className="flex items-center gap-2 text-sm py-1 px-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <Icon className={cn("h-3.5 w-3.5 shrink-0", style.className)} />
                      <span className="text-foreground/90">{action}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="rounded-xl border bg-muted/30 p-4">
        <p className="text-xs font-medium text-muted-foreground mb-3">
          Permission Types Legend
        </p>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-muted-foreground">View/Read access</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5 text-green-500" />
            <span className="text-muted-foreground">Create new items</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Pencil className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-muted-foreground">Edit/Update items</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Trash2 className="h-3.5 w-3.5 text-red-500" />
            <span className="text-muted-foreground">Delete items</span>
          </div>
        </div>
      </div>
    </div>
  );
}
