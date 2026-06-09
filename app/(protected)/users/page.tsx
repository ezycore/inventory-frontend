"use client";

import {
  useCreateUser,
  useDeleteUser,
  useRoles,
  useToggleUserStatus,
  useUpdateUser,
  useUserStats,
} from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import { useAuthStore } from "@/services/stores/use-auth-store";
import type { CustomAction } from "@/types/DataTable";
import type { CardCustomAction } from "@/types/DataCard";
import type { User } from "@/types/users";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { DataTable } from "@/ui/components/dataTable";
import { DataCard } from "@/ui/components/dataCard";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import { DynamicFormConfig } from "@/ui/components/form/type";
import PageHeader from "@/ui/components/header";
import StatsCard, { type StatData } from "@/ui/components/StatsCard";
import ViewToggle from "@/ui/components/ViewToggle";
import UserCardView from "@/components/users/cardview";
import UserCardLoading from "@/components/users/card-loading";
import { ColumnDef } from "@tanstack/react-table";
import {
  AlertCircle,
  Ban,
  CheckCircle,
  CheckCircle2,
  Mail,
  MailCheck,
  Shield,
  UserCheck,
  Users,
} from "lucide-react";
import LocationCountCell from "@/components/locations/LocationCountCell";
import { usersApi } from "@/services/api";
import { ApiResponse, Location, PaginatedResponse } from "@/types";
import { sanitize } from "@/utils";
import { useViewMode } from "@/hooks/use-view-mode";
import { useMemo } from "react";

function formatRoleName(role: string): string {
  return role
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getUserStats(stats: Record<string, any> | undefined): StatData[] {
  const byRole = stats?.byRole || {};
  const topRoles = Object.entries(byRole)
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .slice(0, 2);

  return [
    {
      label: "Total Users",
      value: stats?.total || 0,
      icon: Users,
      variant: "primary",
      description: "All registered users",
    },
    {
      label: "Active",
      value: stats?.active || 0,
      icon: CheckCircle2,
      variant: "success",
      description: "Currently active",
    },
    {
      label: topRoles[0]?.[0] ? formatRoleName(String(topRoles[0][0])) : "Top Role",
      value: Number(topRoles[0]?.[1] || 0),
      icon: Shield,
      variant: "danger",
      description: "Most assigned role",
    },
    {
      label: topRoles[1]?.[0]
        ? formatRoleName(String(topRoles[1][0]))
        : "Second Role",
      value: Number(topRoles[1]?.[1] || 0),
      icon: UserCheck,
      variant: "info",
      description: "Second most assigned role",
    },
  ];
}

// Form configuration for user management
const userFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "firstName",
      type: "input",
      label: "First Name",
      placeholder: "Enter first name",
      required: true,
      columnSpan: 6,
      validation: { minLength: 1, maxLength: 50 },
    },
    {
      name: "lastName",
      type: "input",
      label: "Last Name",
      placeholder: "Enter last name",
      required: true,
      columnSpan: 6,
      validation: { minLength: 1, maxLength: 50 },
    },
    {
      name: "email",
      type: "input",
      label: "Email",
      placeholder: "Enter email address",
      required: true,
      columnSpan: 12,
      validation: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        email: true,
      },
    },
    {
      name: "phone",
      type: "input",
      label: "Phone Number",
      placeholder: "Enter phone number (optional)",
      columnSpan: 12,
    },
    {
      name: "role",
      type: "select",
      label: "Role",
      required: true,
      columnSpan: 12,
      defaultValue: "",
      options: [],
    },
    {
      name: "locationIds",
      type: "select",
      label: "Assign Locations",
      optionsApi: "/locations/active",
      mode: "multiple",
      columnSpan: 12,
      required: false,
      description: "Select locations for roles without all-location access.",
      itemsCreateCallback: (response: ApiResponse<PaginatedResponse<Location>>) => {
        const items = sanitize(response?.data?.items, 'array');
        return items.map((item) => ({
            value: item._id,
            label: `${item.name} (${item.locationType})`,
          }),
        );
      },
    },
  ],
};

// Column definitions
const getColumns = (
  allLocationRoleSlugs: Set<string>,
  roleLabels: Map<string, string>,
): ColumnDef<User>[] => [
  {
    accessorKey: "firstName",
    header: "Name",
    cell: ({ row }) => {
      const firstName = row.getValue("firstName") as string;
      const lastName = row.original.lastName;
      return (
        <div className="flex items-center gap-2">
          <div>
            <div className="font-medium">{`${firstName} ${lastName}`}</div>
            <div className="text-sm text-muted-foreground">
              {row.original.email}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      const variants: Record<string, "default" | "secondary" | "outline"> = {
        admin: "default",
        manager: "secondary",
        staff: "outline",
        viewer: "outline",
      };
      return (
        <Badge variant={variants[role] || "outline"}>
          {roleLabels.get(role) || formatRoleName(role)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "defaultLocationId",
    header: "Location",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <LocationCountCell
          locations={user.locations}
          role={user.role}
          hasAllLocationAccess={allLocationRoleSlugs.has(user.role)}
        />
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <div className="flex items-center gap-2">
          {status === "active" ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">Active</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-600 font-medium">Inactive</span>
            </>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "emailVerified",
    header: "Email Status",
    cell: ({ row }) => {
      const emailVerified = row.getValue("emailVerified") as boolean;
      return (
        <div className="flex items-center gap-2">
          {emailVerified ? (
            <>
              <MailCheck className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">Verified</span>
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 text-amber-600" />
              <span className="text-amber-600 font-medium">Unverified</span>
            </>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => row.getValue("phone") || "—",
  },
  {
    accessorKey: "createdAt",
    header: "Created Date",
    cell: ({ row }) => <DateCell value={row.getValue("createdAt")} />,
  },
];

const searchConfig = {
  globalSearch: true,
  placeholder: "Search users by name, role...",
};

const defaultValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "",
  locationIds: [] as string[],
};

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
    () => getColumns(allLocationRoleSlugs, roleLabels),
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
      ...defaultValues,
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
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="User Management"
        subTitle="Manage users, roles, and permissions in your organization."
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
              searchConfig={searchConfig}
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
              searchConfig={searchConfig}
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
