"use client";
// coding-standard: maintained

import {
  useCreateUser,
  useDeleteUser,
  useRoles,
  useToggleUserStatus,
  useUpdateUser,
  useUserStats,
} from "@/services/api";
import { usersApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import { useAuthStore } from "@/services/stores/use-auth-store";
import type { CustomAction } from "@/types/DataTable";
import type { CardCustomAction } from "@/types/DataCard";
import type { User } from "@/types/users";
import { Button } from "@/ui/components/button";
import { DataTable } from "@/ui/components/dataTable";
import { DataCard } from "@/ui/components/dataCard";
import { DynamicFormConfig } from "@/ui/components/form/type";
import PageHeader from "@/ui/components/header";
import StatsCard from "@/ui/components/StatsCard";
import ViewToggle from "@/ui/components/ViewToggle";
import UserCardView from "@/components/users/cardview";
import UserCardLoading from "@/components/users/card-loading";
import { getUserColumns } from "@/components/users/columns";
import { getUserStats } from "@/components/users/helpers";
import {
  userFormConfig,
  userFormDefaultValues,
  userSearchConfig,
} from "@/components/users/form-config";
import { AlertCircle, Ban, CheckCircle } from "lucide-react";
import { useViewMode } from "@/hooks/use-view-mode";
import { useMemo } from "react";

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [viewMode, setViewMode] = useViewMode("users", "card");

  // All hooks must be called unconditionally at the top level
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const toggleStatusMutation = useToggleUserStatus();
  const { data: statsData, isLoading: statsLoading } = useUserStats?.() ?? { data: undefined, isLoading: false };
  const canManageUsers = !!currentUser?.permissions?.includes("users.manage");
  const { data: rolesData } = useRoles({ enabled: canManageUsers });
  const roles = useMemo(() => rolesData?.data || [], [rolesData]);

  const roleLabels = useMemo(
    () => new Map(roles.map((role) => [role.slug, role.name])),
    [roles],
  );

  const allLocationRoleSlugs = useMemo(
    () =>
      new Set([
        "admin",
        "super_admin",
        ...roles
          .filter((role) => role.permissions.includes("locations.all"))
          .map((role) => role.slug),
      ]),
    [roles],
  );

  const columns = useMemo(
    () => getUserColumns(allLocationRoleSlugs, roleLabels),
    [allLocationRoleSlugs, roleLabels],
  );

  const assignableRoles = useMemo(
    () =>
      roles
        .filter((role) => role.assignable)
        .map((role) => ({
          value: role.slug,
          label: role.name,
        })),
    [roles],
  );

  const roleAwareFormConfig = useMemo<DynamicFormConfig>(() => {
    const fields = userFormConfig.fields.map((field) => {
      if (field.name !== "role") return field;
      return {
        ...field,
        options: assignableRoles,
        defaultValue: assignableRoles[0]?.value || "",
      };
    });
    return {
      ...userFormConfig,
      fields,
    };
  }, [assignableRoles]);

  const roleAwareDefaultValues = useMemo(
    () => ({
      ...userFormDefaultValues,
      role: assignableRoles[0]?.value || "",
    }),
    [assignableRoles],
  );

  // Custom actions for toggling user status
  const customActions: CustomAction[] = [
    {
      type: "toggle-status",
      placement: "cell",
      onClick: (row: User) => {
        toggleStatusMutation.mutate(row._id);
      },
      render: (row: User) => {
        const isActive = row.status === "active";
        return (
          <Button
            variant={isActive ? "destructive" : "default"}
            size="sm"
            onClick={() => toggleStatusMutation.mutate(row._id)}
            className="h-8 px-3"
            disabled={toggleStatusMutation.isPending}
          >
            {isActive ? (
              <>
                <Ban className="h-4 w-4 mr-1" />
                Disable
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                Enable
              </>
            )}
          </Button>
        );
      },
    },
  ];

  const sharedOperations = {
    formConfig: roleAwareFormConfig,
    disabledFieldsInEdit: ["email"],
    defaultValues: roleAwareDefaultValues,
    getAllData: usersApi.getAll,
    createMutation,
    updateMutation,
    deleteMutation,
    queryKey: [...queryKeys.users.all()],
    entityName: "User",
    isViewAvailable: false,
    editTooltip: "Edit User",
    deleteTooltip: "Delete User (must be deactivated first)",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        subTitle="The people in your organization and what they can access."
        actions={canManageUsers ? <ViewToggle storageKey="users" defaultView={viewMode} onChange={setViewMode} /> : undefined}
      />

      {canManageUsers ? (
        <>
          <StatsCard
            data={getUserStats(statsData?.data)}
            isLoading={statsLoading}
          />

          {viewMode === "table" ? (
            <DataTable
              cardTitle={(dataLength: number) => `All Users (${dataLength})`}
              defaultPageSize={10}
              pageSizes={[10, 20, 50, 100]}
              columns={columns}
              selectable={false}
              searchConfig={userSearchConfig}
              enableSorting={true}
              defaultColumnVisibility={{ phone: false }}
              enableRowHover={true}
              rowClassName={(row: User) =>
                row.status === "inactive" ? "bg-red-50 opacity-70" : ""
              }
              customActions={customActions}
              operations={sharedOperations}
            />
          ) : (
            <DataCard<User>
              cardTitle={(n: number) => `All Users (${n})`}
              defaultPageSize={12}
              pageSizes={[12, 24, 48]}
              layoutConfig={{
                layout: "grid",
                columns: { default: 1, sm: 2, lg: 3 },
                gap: "md",
              }}
              searchConfig={userSearchConfig}
              renderCard={(item, actions) =>
                UserCardView(item, actions, {
                  roleLabel: roleLabels.get(item.role),
                  hasAllLocationAccess: allLocationRoleSlugs.has(item.role),
                })
              }
              loadingRenderCard={UserCardLoading}
              customActions={customActions.map((a) => ({ ...a, placement: a.placement === "cell" ? "menu" : a.placement })) as CardCustomAction[]}
              operations={sharedOperations}
            />
          )}
        </>
      ) : (
        <div className="flex items-center justify-center p-12 border rounded-lg">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">
              You do not have permission to view user management.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
