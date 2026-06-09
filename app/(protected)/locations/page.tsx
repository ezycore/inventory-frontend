"use client";

import { ColumnDef } from "@tanstack/react-table";

// Types
import type { Location as LocationType } from "@/types";
import type { DynamicFormConfig } from "@/ui/components/form/type";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type { User } from "@/types/users";

// UI Components
import { UserCountCell } from "@/components/locations/UserCountCell";
import LocationCardView, {
  LocationCardSkeleton,
} from "@/components/locations/cardview";
import { DataTable } from "@/ui/components/dataTable";
import { DataCard } from "@/ui/components/dataCard";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import ViewToggle from "@/ui/components/ViewToggle";

// Hooks & API
import {
  useCreateLocation,
  useDeleteLocation,
  useUpdateLocation,
  useLocationStats,
  useRoles,
} from "@/services/api";
import { locationsApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { FilterConfig } from "@/types/DataTable";
import PageHeader from "@/ui/components/header";
import { sanitize } from "@/utils";
import { useViewMode } from "@/hooks/use-view-mode";
import { cn } from "@/ui/lib/utils";
import {
  CheckCircle2,
  MapPin,
  Store,
  Warehouse,
} from "lucide-react";
import { useMemo } from "react";

function formatRoleName(role: string): string {
  return role
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

// ── Summary stat config ───────────────────────────────────────────────
interface SummaryItem {
  label: string;
  value: number;
  icon: typeof MapPin;
  gradient: string;
  iconBg: string;
  iconColor: string;
  description: string;
}

function getLocationStats(
  stats: Record<string, any> | undefined,
): SummaryItem[] {
  return [
    {
      label: "Total Locations",
      value: stats?.total || 0,
      icon: MapPin,
      gradient: "from-primary/10 to-primary/5",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      description: "All registered locations",
    },
    {
      label: "Active",
      value: stats?.active || 0,
      icon: CheckCircle2,
      gradient: "from-emerald-500/10 to-emerald-500/5",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      description: "Currently active",
    },
    {
      label: "Stores",
      value: stats?.stores || 0,
      icon: Store,
      gradient: "from-blue-500/10 to-blue-500/5",
      iconBg: "bg-blue-50 dark:bg-blue-950/40",
      iconColor: "text-blue-600 dark:text-blue-400",
      description: "Retail locations",
    },
    {
      label: "Warehouses",
      value: stats?.warehouses || 0,
      icon: Warehouse,
      gradient: "from-amber-500/10 to-amber-500/5",
      iconBg: "bg-amber-50 dark:bg-amber-950/40",
      iconColor: "text-amber-600 dark:text-amber-400",
      description: "Storage locations",
    },
  ];
}

// ── Premium summary banner ─────────────────────────────────────────────
function LocationSummaryBanner({
  stats,
  isLoading,
}: {
  stats: SummaryItem[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[108px] rounded-2xl border bg-card animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={cn(
              "relative overflow-hidden rounded-2xl border bg-card p-5",
              "transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
            )}
          >
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-60",
                stat.gradient,
              )}
            />
            <div className="relative flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold tracking-tight tabular-nums">
                  {stat.value}
                </p>
                <p className="text-[11px] text-muted-foreground/60">
                  {stat.description}
                </p>
              </div>
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  stat.iconBg,
                  "ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
                )}
              >
                <Icon className={cn("h-5 w-5", stat.iconColor)} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Column definitions
const columns: ColumnDef<LocationType>[] = [
  {
    accessorKey: "name",
    header: "Location Name",
  },
  {
    accessorKey: "address",
    header: "Address",
  },
  {
    accessorKey: "locationType",
    header: "Type",
  },
  {
    accessorKey: "users",
    header: "Users",
    cell: ({ row }) => <UserCountCell users={row.original.users} />,
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "createdAt",
    header: "Created Date",
    cell: ({ row }) => <DateCell value={row.getValue("createdAt")} />,
  },
  {
    accessorKey: "updatedAt",
    header: "Updated Date",
    cell: ({ row }) => <DateCell value={row.getValue("updatedAt")} />,
  },
];

// Form configuration
const locationFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "name",
      type: "input",
      label: "Location Name",
      placeholder: "Enter location name",
      required: true,
      columnSpan: 12,
      validation: { minLength: 1, maxLength: 100 },
    },
    {
      name: "address",
      type: "input",
      label: "Address",
      placeholder: "Enter address",
      required: true,
      columnSpan: 12,
    },
    {
      name: "locationType",
      type: "select",
      label: "Location Type",
      required: true,
      columnSpan: 12,
      options: [
        { value: "store", label: "Store" },
        { value: "warehouse", label: "Warehouse" },
      ],
    },
    {
      name: "users",
      type: "select",
      label: "Assign Users",
      optionsApi: "/users",
      mode: "multiple",
      columnSpan: 12,
      required: false,
      description:
        "Select users for roles without all-location access.",
      itemsCreateCallback: (response: ApiResponse<PaginatedResponse<User>>) => {
        const items = sanitize(response?.data?.items, 'array');
        return items
          .map((item) => ({
            value: item._id,
            label: `${item.firstName} ${item.lastName} <${item.email}> - ${item.role}`,
          }));
      },
    },
    {
      name: "status",
      type: "select",
      label: "Status",
      required: true,
      columnSpan: 12,
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ],
};

// Filter configuration
const locationFilterConfig: FilterConfig = {
  fields: [
    {
      name: "name",
      label: "Search location",
      type: "text",
      placeholder: "Search by name...",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      placeholder: "All statuses",
      columnSpan: 2,
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
  ],
  viewMode: "popover",
  columns: 2,
  applyOnChange: false,
  showResetButton: true,
  showApplyButton: true,
};

const searchConfig = {
  globalSearch: true,
  placeholder: "Search locations by name, address, or status...",
};

const defaultValues = {
  name: "",
  address: "",
  locationType: "store" as const,
  status: "active" as const,
};

export default function LocationsPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [viewMode, setViewMode] = useViewMode("locations", 'card');
  const { data: statsData, isLoading: statsLoading } = useLocationStats?.() ?? { data: undefined, isLoading: false };
  const canManageUsers = !!currentUser?.permissions?.includes("users.manage");
  const { data: rolesData } = useRoles({ enabled: canManageUsers });
  const roles = rolesData?.data || [];

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

  const roleAwareLocationFormConfig = useMemo<DynamicFormConfig>(() => {
    const fields = locationFormConfig.fields.map((field) => {
      if (field.name !== "users") return field;

      return {
        ...field,
        description:
          "Select users for roles without all-location access.",
        itemsCreateCallback: (response: ApiResponse<PaginatedResponse<User>>) => {
          const items = sanitize(response?.data?.items, "array");
          return items
            .filter((item) => !allLocationRoleSlugs.has(item.role))
            .map((item) => ({
              value: item._id,
              label: `${item.firstName} ${item.lastName} <${item.email}> - ${
                roleLabels.get(item.role) || formatRoleName(item.role)
              }`,
            }));
        },
      };
    });

    return {
      ...locationFormConfig,
      fields,
    };
  }, [allLocationRoleSlugs, roleLabels]);

  const sharedOperations = {
    formConfig: roleAwareLocationFormConfig,
    defaultValues: defaultValues,
    getAllData: locationsApi.getAll,
    createMutation: useCreateLocation(),
    updateMutation: useUpdateLocation(),
    deleteMutation: useDeleteLocation(),
    queryKey: [...queryKeys.locations.all()],
    entityName: "Location" as const,
    isViewAvailable: false,
    editTooltip: "Edit Location",
    deleteTooltip: "Delete Location",
    prepareSubmitData: (
      data: LocationType,
      isEdit: boolean,
      item: LocationType,
    ) => ({
      ...data,
      ...(isEdit && item ? { id: item._id } : {}),
    }),
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <PageHeader
        title="Locations Management"
        subTitle="Manage your stores and warehouses in one place."
        actions={
          <ViewToggle
            storageKey="locations"
            defaultView={viewMode}
            onChange={setViewMode}
          />
        }
      />

      {/* Stats Banner */}
      <LocationSummaryBanner
        stats={getLocationStats(statsData)}
        isLoading={statsLoading}
      />

      {/* Table View */}
      {viewMode === "table" && (
        <DataTable
          cardTitle={(dataLength: number) => `All Locations (${dataLength})`}
          defaultPageSize={10}
          pageSizes={[10, 20, 50, 100]}
          filterConfig={locationFilterConfig}
          columns={columns}
          selectable={true}
          searchConfig={searchConfig}
          enableSorting={true}
          defaultColumnVisibility={{ status: false }}
          enableRowHover={true}
          rowClassName={(row: LocationType) =>
            row.status === "inactive" ? "bg-red-50 opacity-70" : ""
          }
          operations={sharedOperations}
        />
      )}

      {/* Card View */}
      {viewMode === "card" && (
        <DataCard
          cardTitle={(n) => `All Locations (${n})`}
          defaultPageSize={12}
          pageSizes={[12, 24, 48]}
          filterConfig={locationFilterConfig}
          layoutConfig={{
            layout: "grid",
            columns: { default: 1, sm: 2, lg: 3 },
            gap: "lg",
          }}
          searchConfig={searchConfig}
          renderCard={LocationCardView}
          loadingRenderCard={() => <LocationCardSkeleton />}
          operations={sharedOperations}
        />
      )}
    </div>
  );
}
