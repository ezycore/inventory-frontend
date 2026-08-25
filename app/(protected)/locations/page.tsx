"use client";
// coding-standard: maintained

import { selectOptions } from "@/services/api/select-options";
import { useTranslations, useLocale } from "next-intl";
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
import { isFeatureEnabled } from "@/lib/feature-utils";
import Link from "next/link";
import { FilterConfig } from "@/types/DataTable";
import type { Translator } from "@/i18n/config";
import type { AppLocale } from "@/i18n/config";
import PageHeader from "@/ui/components/header";
import { sanitize } from "@/utils";
import { fullName } from "@/utils/user-name";
import { useViewMode } from "@/hooks/use-view-mode";
import { cn } from "@/ui/lib/utils";
import { isPermissionDeniedError } from "@/lib/api-client";
import {
  CheckCircle2,
  Lock,
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
  t: Translator,
): SummaryItem[] {
  return [
    {
      label: t("stats.total"),
      value: stats?.total || 0,
      icon: MapPin,
      gradient: "from-primary/10 to-primary/5",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      description: t("stats.totalDescription"),
    },
    {
      label: t("stats.active"),
      value: stats?.active || 0,
      icon: CheckCircle2,
      gradient: "from-emerald-500/10 to-emerald-500/5",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      description: t("stats.activeDescription"),
    },
    {
      label: t("stats.stores"),
      value: stats?.stores || 0,
      icon: Store,
      gradient: "from-blue-500/10 to-blue-500/5",
      iconBg: "bg-blue-50 dark:bg-blue-950/40",
      iconColor: "text-blue-600 dark:text-blue-400",
      description: t("stats.storesDescription"),
    },
    {
      label: t("stats.warehouses"),
      value: stats?.warehouses || 0,
      icon: Warehouse,
      gradient: "from-amber-500/10 to-amber-500/5",
      iconBg: "bg-amber-50 dark:bg-amber-950/40",
      iconColor: "text-amber-600 dark:text-amber-400",
      description: t("stats.warehousesDescription"),
    },
  ];
}

// ── Premium summary banner ─────────────────────────────────────────────
function LocationSummaryBanner({
  stats,
  isLoading,
  isPermissionDenied,
}: {
  stats: SummaryItem[];
  isLoading: boolean;
  isPermissionDenied: boolean;
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

  // A denied stats query used to fall back to `stats?.total || 0`, which read
  // as "you have no locations" rather than "you may not see this count" — the
  // table below already explains the real reason via ErrorBoundaryFallback,
  // so the banner just steps aside instead of showing a false zero.
  if (isPermissionDenied) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <Lock className="h-4 w-4 shrink-0" />
        <span>You don&apos;t have permission to view location stats.</span>
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
const getColumns = (t: Translator): ColumnDef<LocationType>[] => [
  {
    accessorKey: "name",
    header: t("columns.name"),
  },
  {
    accessorKey: "address",
    header: t("columns.address"),
  },
  {
    accessorKey: "locationType",
    header: t("columns.type"),
  },
  {
    accessorKey: "users",
    header: t("columns.users"),
    cell: ({ row }) => <UserCountCell users={row.original.users} />,
  },
  {
    accessorKey: "status",
    header: t("columns.status"),
  },
  {
    accessorKey: "createdAt",
    header: t("columns.createdDate"),
    cell: ({ row }) => <DateCell value={row.getValue("createdAt")} />,
  },
  {
    accessorKey: "updatedAt",
    header: t("columns.updatedDate"),
    cell: ({ row }) => <DateCell value={row.getValue("updatedAt")} />,
  },
];

// Form configuration
const getLocationFormConfig = (t: Translator): DynamicFormConfig => ({
  fields: [
    {
      name: "name",
      type: "input",
      label: t("form.name"),
      placeholder: t("form.namePlaceholder"),
      required: true,
      columnSpan: 12,
      validation: { minLength: 1, maxLength: 100 },
    },
    {
      name: "address",
      type: "input",
      label: t("form.address"),
      placeholder: t("form.addressPlaceholder"),
      required: true,
      columnSpan: 12,
    },
    {
      name: "locationType",
      type: "select",
      label: t("form.type"),
      required: true,
      columnSpan: 12,
      options: [
        { value: "store", label: t("type.store") },
        { value: "warehouse", label: t("type.warehouse") },
      ],
    },
    {
      name: "users",
      type: "select",
      label: t("form.users"),
      optionsApi: selectOptions("users"),
      mode: "multiple",
      columnSpan: 12,
      required: false,
      description: t("form.usersDescription"),
      itemsCreateCallback: (response: ApiResponse<PaginatedResponse<User>>) => {
        const items = sanitize(response?.data?.items, 'array');
        return items
          .map((item) => ({
            value: item._id,
            label: `${fullName(item)} <${item.email}> - ${item.role}`,
          }));
      },
    },
    {
      name: "status",
      type: "select",
      label: t("form.status"),
      required: true,
      columnSpan: 12,
      options: [
        { value: "active", label: t("status.active") },
        { value: "inactive", label: t("status.inactive") },
      ],
    },
  ],
});

// Filter configuration
const getLocationFilterConfig = (t: Translator): FilterConfig => ({
  fields: [
    {
      name: "search",
      label: t("filters.searchLabel"),
      type: "text",
      placeholder: t("filters.searchPlaceholder"),
    },
    {
      name: "status",
      label: t("filters.statusLabel"),
      type: "select",
      placeholder: t("filters.statusPlaceholder"),
      columnSpan: 2,
      options: [
        { label: t("status.active"), value: "active" },
        { label: t("status.inactive"), value: "inactive" },
      ],
    },
  ],
  viewMode: "popover",
  columns: 2,
  applyOnChange: false,
  showResetButton: true,
  showApplyButton: true,
});

const defaultValues = {
  name: "",
  address: "",
  locationType: "store" as const,
  status: "active" as const,
};

export default function LocationsPage() {
  const t = useTranslations("settings.locations");
  const locale = useLocale() as AppLocale;
  const currentUser = useAuthStore((state) => state.user);
  // This page stays reachable with `multiLocation` off — the org's single
  // location carries the shop address, and this is where it is edited. What the
  // feature controls is whether a SECOND location may be added; the backend
  // enforces the same rule on create (docs/plan/onboarding-workspace.md §3.1).
  const canAddLocation = isFeatureEnabled(
    currentUser?.organization?.features,
    "multiLocation",
  );
  const [viewMode, setViewMode] = useViewMode("locations", 'card');
  const { data: statsData, isLoading: statsLoading, error: statsError } = useLocationStats?.() ?? { data: undefined, isLoading: false, error: undefined };
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

  const roleAwareLocationFormConfig = useMemo<DynamicFormConfig>(() => {
    const locationFormConfig = getLocationFormConfig(t);
    const fields = locationFormConfig.fields.map((field) => {
      if (field.name !== "users") return field;

      return {
        ...field,
        description: t("form.usersDescription"),
        itemsCreateCallback: (response: ApiResponse<PaginatedResponse<User>>) => {
          const items = sanitize(response?.data?.items, "array");
          return items
            .filter((item) => !allLocationRoleSlugs.has(item.role))
            .map((item) => ({
              value: item._id,
              label: `${fullName(item)} <${item.email}> - ${
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
  }, [allLocationRoleSlugs, roleLabels, t]);

  const columns = useMemo(() => getColumns(t), [t]);
  const locationFilterConfig = useMemo(() => getLocationFilterConfig(t), [t]);

  // Hooks must run unconditionally; only whether the table receives the
  // mutation is conditional — DataTable/DataCard render their "Add" action if
  // and only if `createMutation` is present.
  const createLocation = useCreateLocation();

  const sharedOperations = {
    formConfig: roleAwareLocationFormConfig,
    defaultValues: defaultValues,
    getAllData: locationsApi.getAll,
    createMutation: canAddLocation ? createLocation : undefined,
    updateMutation: useUpdateLocation(),
    deleteMutation: useDeleteLocation(),
    queryKey: queryKeys.locations.all(),
    entityName: "Location" as const,
    isViewAvailable: false,
    editTooltip: t("form.editTooltip"),
    deleteTooltip: t("form.deleteTooltip"),
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
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title={t("title")}
        subTitle={t("subtitle")}
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
        stats={getLocationStats(statsData, t)}
        isLoading={statsLoading}
        isPermissionDenied={isPermissionDeniedError(statsError)}
      />

      {/* The switch belongs where the need appears: a merchant wanting a second
          shop comes here, not to a settings page they have no reason to open. */}
      {!canAddLocation && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>{t("singleLocation.notice")}</span>
          <Link
            href="/settings/features"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("singleLocation.enable")}
          </Link>
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <DataTable
          cardTitle={(dataLength: number) => t("allLocationsCount", { count: dataLength })}
          defaultPageSize={10}
          pageSizes={[10, 20, 50, 100]}
          filterConfig={locationFilterConfig}
          columns={columns}
          selectable={true}
          enableSorting={true}
          defaultColumnVisibility={{ status: false }}
          enableRowHover={true}
          rowClassName={(row: LocationType) =>
            row.status === "inactive" ? "bg-red-50 opacity-70 dark:bg-red-950/40" : ""
          }
          operations={sharedOperations}
        />
      )}

      {/* Card View */}
      {viewMode === "card" && (
        <DataCard
          cardTitle={(n) => t("allLocationsCount", { count: n })}
          defaultPageSize={12}
          pageSizes={[12, 24, 48]}
          filterConfig={locationFilterConfig}
          layoutConfig={{
            layout: "grid",
            columns: { default: 1, sm: 2, lg: 3 },
            gap: "lg",
          }}
          renderCard={(item, actions) => LocationCardView(item, actions, { t, locale })}
          loadingRenderCard={() => <LocationCardSkeleton />}
          operations={sharedOperations}
        />
      )}
    </div>
  );
}
