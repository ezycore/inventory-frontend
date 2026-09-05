"use client";
// coding-standard: maintained

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Plus } from "lucide-react";
import { RoleDeleteDialog } from "@/components/settings/roles/role-delete-dialog";
import { RoleDetailsSheet } from "@/components/settings/roles/role-details-sheet";
import { RoleFormSheet } from "@/components/settings/roles/role-form-sheet";
import { RolesTable } from "@/components/settings/roles/roles-table";
import { PERMISSIONS, useHasPermission } from "@/hooks/use-has-permission";
import { useRoles } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { Button } from "@/ui/components/button";
import EmptyState from "@/ui/components/EmptyState";
import PageHeader from "@/ui/components/header";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/ui/components/tooltip";
import type { OrganizationRole } from "@/types/users";
import { useRequireAccess } from "@/hooks/use-require-access";

/** Mirrors MAX_CUSTOM_ROLES_PER_ORG in the backend's constants/permissions.ts. */
const MAX_CUSTOM_ROLES = 50;

export default function RolesSettingsPage() {
  const t = useTranslations("settings.roles");
  const tShell = useTranslations("settings.shell");
  const user = useAuthStore((state) => state.user);
  const canViewRoles = useHasPermission(PERMISSIONS.rolesView);
  const canManageUsers = useHasPermission(PERMISSIONS.usersManage);
  const canManageRoles = useHasPermission(PERMISSIONS.rolesManage);

  const isOwner =
    !!user?.id &&
    !!user?.organization?.ownerId &&
    user.id === user.organization.ownerId;
  // Matches the backend's three-way read gate: an owner keeps access even if
  // their own role was edited down, and `users.manage` needs the list to place
  // people in roles.
  const canView = isOwner || canViewRoles || canManageUsers;

  const { data, isLoading, isError, refetch } = useRoles({ enabled: canView });

  const [selectedRole, setSelectedRole] = useState<OrganizationRole | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [formRole, setFormRole] = useState<OrganizationRole | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteRole, setDeleteRole] = useState<OrganizationRole | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  /**
   * Bumped on every open so the sheet and dialog remount with fresh state.
   * That is the reset mechanism — both seed their fields from props at mount,
   * which keeps them free of the effect-writes-state pattern React now warns
   * about, and means reopening "New role" never shows the last draft.
   */
  const [session, setSession] = useState(0);

  useRequireAccess([{ allowed: canView, message: tShell("noPermission") }]);

  const roles = useMemo(() => data?.data ?? [], [data]);
  const customCount = useMemo(
    () => roles.filter((role) => role.source === "custom").length,
    [roles],
  );
  // Counted from the list already on the page rather than a second request.
  // The API enforces the real limit; this only avoids opening a doomed form.
  const atLimit = customCount >= MAX_CUSTOM_ROLES;

  if (user && !canView) {
    return null;
  }

  const openForm = (role: OrganizationRole | null) => {
    setFormRole(role);
    setSession((n) => n + 1);
    setFormOpen(true);
  };

  const openDelete = (role: OrganizationRole) => {
    setDeleteRole(role);
    setSession((n) => n + 1);
    setDeleteOpen(true);
  };

  const createButton = (
    <Button onClick={() => openForm(null)} disabled={atLimit}>
      <Plus className="h-4 w-4" />
      {t("createButton")}
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        subTitle={t("subtitle")}
        actions={
          canManageRoles ? (
            atLimit ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>{createButton}</span>
                </TooltipTrigger>
                <TooltipContent>
                  {t("limitReached", { max: MAX_CUSTOM_ROLES })}
                </TooltipContent>
              </Tooltip>
            ) : (
              createButton
            )
          ) : undefined
        }
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
          onEdit={canManageRoles ? (role) => openForm(role) : undefined}
          onDelete={canManageRoles ? openDelete : undefined}
        />
      )}

      <RoleDetailsSheet
        role={selectedRole}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <RoleFormSheet
        key={`form-${session}`}
        role={formRole}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <RoleDeleteDialog
        key={`delete-${session}`}
        role={deleteRole}
        roles={roles}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
