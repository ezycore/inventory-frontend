"use client";

import {
  useCreateUser,
  useDeleteUser,
  useToggleUserStatus,
  useUpdateUser,
} from "@/hooks/queries/use-users";
import { queryKeys } from "@/lib/query-keys-products";
import { useAuthStore } from "@/stores/use-auth-store";
import type { CustomAction } from "@/types/DataTable";
import type { User } from "@/types/users";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { DataTable } from "@/ui/components/dataTable";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import { DynamicFormConfig } from "@/ui/components/form/type";
import PageHeader from "@/ui/components/header";
import { ColumnDef } from "@tanstack/react-table";
import {
  AlertCircle,
  Ban,
  CheckCircle,
  CheckCircle2,
  Mail,
  MailCheck,
} from "lucide-react";
import LocationCountCell from "@/components/locations/LocationCountCell";
import { usersApi } from "@/lib/api";

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
      defaultValue: "staff",
      options: [
        { value: "admin", label: "Admin" },
        { value: "manager", label: "Manager" },
        { value: "staff", label: "Staff" },
        { value: "viewer", label: "Viewer" },
      ],
    },
    {
      name: "locationIds",
      type: "select",
      label: "Assign Locations",
      optionsApi: "/locations/active",
      mode: "multiple",
      columnSpan: 12,
      required: false,
      description: "Select locations to assign (leave empty for Admin - they have access to all locations)",
      itemsCreateCallback: (response) => {
        const items = response?.data?.items || response?.data || [];
        return items.map(
          (item: { _id?: string; name?: string; locationType?: string }) => ({
            value: item._id,
            label: `${item.name} (${item.locationType})`,
          }),
        );
      },
    },
  ],
};

// Column definitions
const columns: ColumnDef<User>[] = [
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
          {role.charAt(0).toUpperCase() + role.slice(1)}
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
        <LocationCountCell locations={user.locations} role={user.role} />
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
  role: "staff" as const,
  locationIds: [] as string[],
};

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();

  // All hooks must be called unconditionally at the top level
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const toggleStatusMutation = useToggleUserStatus();

  // Check if current user is admin or manager
  const isAdminOrManager =
    currentUser?.role === "admin" || currentUser?.role === "manager";

  // Custom actions for toggling user status
  // We'll create a render function that shows the appropriate button
  const customActions: CustomAction[] = [
    {
      type: "toggle-status",
      placement: "cell",
      onClick: (row: User) => {
        toggleStatusMutation.mutate(row._id);
      },
      // Custom render to show different button based on status
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="User Management"
        subTitle="Manage users, roles, and permissions in your organization."
      />

      {/* Only show table if user is admin or manager */}
      {isAdminOrManager ? (
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
          operations={{
            formConfig: userFormConfig,
            disabledFieldsInEdit: ["email"],
            defaultValues: defaultValues,
            getAllData: usersApi.getAll,
            createMutation: createMutation,
            updateMutation: updateMutation,
            deleteMutation: deleteMutation,
            queryKey: [...queryKeys.users.all()],
            entityName: "User",
            isViewAvailable: false,
            editTooltip: "Edit User",
            deleteTooltip: "Delete User (must be deactivated first)"
          }}
        />
      ) : (
        <div className="flex items-center justify-center p-12 border rounded-lg">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">
              Only administrators and managers can view and manage users.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
