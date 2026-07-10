"use client";
// coding-standard: maintained

import { useAuthStore } from "@/services/stores/use-auth-store";
import {
  groupPermissions,
  PermissionGroupCard,
} from "@/components/shared/permissions";
import { Eye, Layers, Lock, Pencil, Plus, Shield, Trash2 } from "lucide-react";

/** Read-only overview of the signed-in user's permissions, grouped by category. */
export function PermissionsTab() {
  const { user } = useAuthStore();
  const permissions = user?.permissions || [];
  const groupedPermissions = groupPermissions(permissions);

  const totalPermissions = permissions.length;
  const totalCategories = Object.keys(groupedPermissions).length;

  const breakdown = permissions.reduce(
    (acc, perm) => {
      const action = perm.split(".")[1]?.toLowerCase() || "";
      if (action.includes("create") || action.includes("add")) acc.create++;
      else if (action.includes("delete") || action.includes("remove"))
        acc.delete++;
      else if (action.includes("update") || action.includes("edit"))
        acc.update++;
      else if (
        action.includes("view") ||
        action.includes("read") ||
        action.includes("list")
      )
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
        {Object.entries(groupedPermissions).map(([category, perms]) => (
          <PermissionGroupCard
            key={category}
            category={category}
            permissions={perms}
          />
        ))}
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
