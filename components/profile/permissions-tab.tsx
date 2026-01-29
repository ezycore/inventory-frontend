"use client";

import { Badge } from "@/ui/components/badge";
import { useAuthStore } from "@/stores/use-auth-store";
import { Shield, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";

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
    ? action.charAt(0).toUpperCase() + action.slice(1)
    : permission;
};

// Get category display name
const getCategoryName = (category: string) => {
  const names: Record<string, string> = {
    products: "Products",
    categories: "Categories",
    brands: "Brands",
    stock: "Stock & Inventory",
    reports: "Reports & Analytics",
    organization: "Organization",
    users: "User Management",
    suppliers: "Suppliers",
    customers: "Customers",
    locations: "Locations",
    taxes: "Taxes",
    units: "Units",
  };
  return names[category] || category.charAt(0).toUpperCase() + category.slice(1);
};

export function PermissionsTab() {
  const { user } = useAuthStore();
  const permissions = user?.permissions || [];
  const groupedPermissions = groupPermissions(permissions);

  return (
    <div className="space-y-6">
      {/* Permissions List */}
      <div className="space-y-4">
        {Object.keys(groupedPermissions).length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                No permissions assigned
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(groupedPermissions).map(([category, perms]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {getCategoryName(category)}
                  </CardTitle>
                  <CardDescription>
                    {perms.length} {perms.length === 1 ? "permission" : "permissions"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {perms.map((permission) => (
                      <div
                        key={permission}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>{formatPermission(permission)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
