"use client";
// coding-standard: maintained

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { RoleDetailsSheet } from "@/components/settings/roles/role-details-sheet";
import { RolesTable } from "@/components/settings/roles/roles-table";
import { PERMISSIONS, useHasPermission } from "@/hooks/use-has-permission";
import { useRoles } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import EmptyState from "@/ui/components/EmptyState";
import PageHeader from "@/ui/components/header";
import type { OrganizationRole } from "@/types/users";

export default function RolesSettingsPage() {
  const t = useTranslations("settings.roles");
  const tShell = useTranslations("settings.shell");
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const canManageUsers = useHasPermission(PERMISSIONS.usersManage);

  const isOwner =
    !!user?.id &&
    !!user?.organization?.ownerId &&
    user.id === user.organization.ownerId;
  const canView = isOwner || canManageUsers;

  const { data, isLoading, isError, refetch } = useRoles({ enabled: canView });

  const [selectedRole, setSelectedRole] = useState<OrganizationRole | null>(
    null
  );
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (user && !canView) {
      toast.error(tShell("noPermission"));
      router.push("/");
    }
  }, [user, canView, router, tShell]);

  if (user && !canView) {
    return null;
  }

  const roles = data?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        subTitle={t("subtitle")}
      />

      {isError ? (
        <EmptyState
          icon={AlertCircle}
          title={t("loadErrorTitle")}
          description={t("loadErrorDescription")}
          action={{ label: t("retry"), onClick: () => void refetch() }}
        />
      ) : (
        <RolesTable
          roles={roles}
          isLoading={!user || isLoading}
          onSelect={(role) => {
            setSelectedRole(role);
            setDetailsOpen(true);
          }}
        />
      )}

      <RoleDetailsSheet
        role={selectedRole}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
}
