"use client";

import { useRoles } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { Badge } from "@/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import PageHeader from "@/ui/components/header";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";

export default function RolesSettingsPage() {
  const user = useAuthStore((state) => state.user);

  const isOwner =
    !!user?.id &&
    !!user?.organization?.ownerId &&
    user.id === user.organization.ownerId;

  const { data, isLoading } = useRoles({ enabled: isOwner });

  if (!isOwner) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center gap-3 py-8 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <p>Only the workspace owner can view all organization roles.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const roles = data?.data || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Roles"
        subTitle="Read-only view of all roles and permissions synced to this workspace."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((role) => (
          <Card key={role.slug}>
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  {role.name}
                </CardTitle>
                <Badge variant={role.source === "system" ? "secondary" : "outline"}>
                  {role.source === "system" ? "System" : "MC"}
                </Badge>
              </div>
              <CardDescription>
                {role.description || "No description provided."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground">
                Slug: <span className="font-mono">{role.slug}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {role.permissions.length === 0 ? (
                  <Badge variant="outline">No permissions</Badge>
                ) : (
                  role.permissions.map((permission) => (
                    <Badge key={permission} variant="outline">
                      {permission}
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
