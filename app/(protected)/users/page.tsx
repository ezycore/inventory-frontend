"use client";
// coding-standard: maintained

import { useTranslations, useLocale } from "next-intl";
import {
  useCreateUser,
  useDeleteUser,
  useLocations,
  useRoles,
  useToggleUserStatus,
  useUpdateUser,
  useUserStats,
} from "@/services/api";
import { usersApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import { useAuthStore } from "@/services/stores/use-auth-store";
import type { CustomAction } from "@/types/DataTable";
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
  getUserFormConfig,
  userFormDefaultValues,
  getUserFilterConfig,
} from "@/components/users/form-config";
import { AlertCircle, Ban, CheckCircle } from "lucide-react";
import { useViewMode } from "@/hooks/use-view-mode";
import { useMemo } from "react";

export default function UsersPage() {
  const t = useTranslations("settings.users");
  const locale = useLocale() as "en" | "bn";
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

  // The first active location, used to pre-fill the (now required) Locations
  // field. Same ordering the form's own `activeLocations` options use, so the
  // pre-selected entry is the one sitting at the top of the list.
  const { data: locationsData } = useLocations({ status: "active", limit: 1 });
  const defaultLocationIds = useMemo(() => {
    const first = locationsData?.items?.[0]?._id;
    return first ? [first] : [];
  }, [locationsData]);

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
    () => getUserColumns(allLocationRoleSlugs, roleLabels, t),
    [allLocationRoleSlugs, roleLabels, t],
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

  /**
   * The role a brand-new hire gets before anyone chooses: the **least**
   * privileged one on offer.
   *
   * This used to be `assignableRoles[0]`, i.e. whichever role sorted first —
   * which is alphabetically `admin`. Add a cashier, tab past the Role field, and
   * they arrived holding all 85 permissions, billing and user management
   * included. Counting permissions rather than hard-coding a slug means a
   * merchant's own custom roles are ranked too.
   */
  const leastPrivilegedRole = useMemo(() => {
    const ranked = roles
      .filter((role) => role.assignable)
      .slice()
      .sort((a, b) => a.permissions.length - b.permissions.length);
    return ranked[0]?.slug ?? "";
  }, [roles]);

  const roleAwareFormConfig = useMemo<DynamicFormConfig>(() => {
    const userFormConfig = getUserFormConfig(t);
    const fields = userFormConfig.fields.map((field) => {
      if (field.name === "role") {
        return {
          ...field,
          options: assignableRoles,
          defaultValue: leastPrivilegedRole,
        };
      }
      if (field.name === "locationIds") {
        return {
          ...field,
          // Pre-select the first location so the common case — one shop, one
          // new cashier — is already correct when the form opens, and the
          // required field is never the thing that blocks a save.
          defaultValue: defaultLocationIds,
          // Roles carrying `locations.all` are org-wide by definition; the
          // backend stores an empty list for them, so asking is misleading.
          // Hidden values are stripped, so nothing is sent for those roles.
          dependsOn: {
            field: "role",
            // `role` carries static options, so the form enriches its watched
            // value into the whole `{ value, label }` option before comparing.
            // Without this the check runs against an object, never matches a
            // slug, and the field shows for every role including admins.
            matchWithProp: "value",
            condition: "notIn" as const,
            value: [...allLocationRoleSlugs],
            action: "show" as const,
          },
        };
      }
      return field;
    });
    return {
      ...userFormConfig,
      fields,
    };
  }, [assignableRoles, leastPrivilegedRole, allLocationRoleSlugs, defaultLocationIds, t]);

  const roleAwareDefaultValues = useMemo(
    () => ({
      ...userFormDefaultValues,
      role: leastPrivilegedRole,
      locationIds: defaultLocationIds,
    }),
    [leastPrivilegedRole, defaultLocationIds],
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
                {t("actions.disable")}
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                {t("actions.enable")}
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
    queryKey: queryKeys.users.all(),
    entityName: "User",
    isViewAvailable: false,
    editTooltip: t("form.editTooltip"),
    deleteTooltip: t("form.deleteTooltip"),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        subTitle={t("subtitle")}
        actions={canManageUsers ? <ViewToggle storageKey="users" defaultView={viewMode} onChange={setViewMode} /> : undefined}
      />

      {canManageUsers ? (
        <>
          <StatsCard
            // `useStats` already unwraps the envelope (`select: (d) => d.data`),
            // so reading `.data` again yielded undefined and every card fell to
            // its `|| 0` — "Total Users 0" above a list of two. Every sibling
            // stats page passes `statsData` directly; this was the outlier.
            data={getUserStats(statsData, t)}
            isLoading={statsLoading}
          />

          {viewMode === "table" ? (
            <DataTable
              cardTitle={(dataLength: number) => t("allUsersCount", { count: dataLength })}
              defaultPageSize={10}
              pageSizes={[10, 20, 50, 100]}
              columns={columns}
              selectable={false}
              filterConfig={getUserFilterConfig(t)}
              enableSorting={true}
              defaultColumnVisibility={{ phone: false }}
              enableRowHover={true}
              rowClassName={(row: User) =>
                row.status === "inactive" ? "bg-red-50 opacity-70 dark:bg-red-950/40" : ""
              }
              customActions={customActions}
              operations={sharedOperations}
            />
          ) : (
            <DataCard<User>
              cardTitle={(n: number) => t("allUsersCount", { count: n })}
              defaultPageSize={12}
              pageSizes={[12, 24, 48]}
              layoutConfig={{
                layout: "grid",
                columns: { default: 1, sm: 2, lg: 3 },
                gap: "md",
              }}
              filterConfig={getUserFilterConfig(t)}
              renderCard={(item, actions) =>
                UserCardView(
                  item,
                  {
                    ...actions,
                    // Injected rather than passed as a `customAction`: a custom
                    // `renderCard` never receives them — `CardItem` forwards only
                    // edit/view/delete — so remapping the table's cell action to
                    // a menu one reached nothing, and the card had no way to
                    // enable or disable anyone. Same pattern as categories'
                    // `onApplyVat`.
                    //
                    // Omitted for your own row: the server refuses
                    // self-deactivation, so the item would only ever error.
                    ...(item._id === currentUser?.id
                      ? {}
                      : {
                          onToggleStatus: () =>
                            toggleStatusMutation.mutate(item._id),
                        }),
                  },
                  {
                    roleLabel: roleLabels.get(item.role),
                    hasAllLocationAccess: allLocationRoleSlugs.has(item.role),
                    t,
                    locale,
                  },
                )
              }
              loadingRenderCard={UserCardLoading}
              operations={sharedOperations}
            />
          )}
        </>
      ) : (
        <div className="flex items-center justify-center p-12 border rounded-lg">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("accessRestrictedTitle")}</h3>
            <p className="text-muted-foreground">
              {t("accessRestrictedDescription")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
