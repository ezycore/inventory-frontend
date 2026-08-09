"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { ChevronRight, Lock, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { Card, CardContent } from "@/ui/components/card";
import EmptyState from "@/ui/components/EmptyState";
import { SimpleTable, type SimpleColumn } from "@/ui/components/simple-table";
import { Skeleton } from "@/ui/components/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/ui/components/tooltip";
import type { Translator } from "@/i18n/config";
import type { OrganizationRole } from "@/types/users";

interface RolesTableProps {
  roles: OrganizationRole[];
  isLoading: boolean;
  onSelect: (role: OrganizationRole) => void;
  /** Omitted when the viewer lacks `roles.manage` — then the table stays read-only. */
  onEdit?: (role: OrganizationRole) => void;
  onDelete?: (role: OrganizationRole) => void;
}

/**
 * Three sources, three different owners: `system` is defined in code, `mc` is
 * owned by the platform, `custom` is the merchant's own — and only the last is
 * editable here.
 */
function SourceBadge({
  source,
  t,
}: {
  source: OrganizationRole["source"];
  t: Translator;
}) {
  if (source === "system") return <Badge variant="secondary">{t("system")}</Badge>;
  if (source === "mc") return <Badge variant="outline">{t("missionControl")}</Badge>;
  return (
    <Badge variant="outline" className="border-primary/40 text-primary">
      {t("custom")}
    </Badge>
  );
}

const getColumns = (
  t: Translator,
  onEdit?: (role: OrganizationRole) => void,
  onDelete?: (role: OrganizationRole) => void,
): SimpleColumn<OrganizationRole>[] => [
  {
    key: "role",
    header: t("role"),
    cell: (role) => (
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="truncate">{role.name}</span>
            {role.locked && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  {t("lockedTooltip")}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="truncate font-mono text-xs text-muted-foreground">
            {role.slug}
          </div>
        </div>
      </div>
    ),
  },
  {
    key: "description",
    header: t("description"),
    headClassName: "hidden md:table-cell",
    cellClassName: "hidden md:table-cell max-w-[320px]",
    cell: (role) => (
      <span className="block truncate text-muted-foreground">
        {role.description || "—"}
      </span>
    ),
  },
  {
    key: "source",
    header: t("source"),
    headClassName: "hidden sm:table-cell",
    cellClassName: "hidden sm:table-cell",
    cell: (role) => <SourceBadge source={role.source} t={t} />,
  },
  {
    key: "permissions",
    header: t("permissions"),
    align: "right",
    cell: (role) => (
      <Badge variant="outline" className="tabular-nums">
        {role.permissions.length}
      </Badge>
    ),
  },
  {
    key: "open",
    header: <span className="sr-only">{t("open")}</span>,
    align: "right",
    headClassName: "w-24",
    cell: (role) => (
      <div
        className="flex items-center justify-end gap-0.5"
        // The row opens the read-only details drawer; the action buttons must
        // not do that too.
        onClick={(event) => event.stopPropagation()}
      >
        {role.source === "custom" && onEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={t("edit")}
            onClick={() => onEdit(role)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        {role.source === "custom" && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            aria-label={t("delete")}
            onClick={() => onDelete(role)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    ),
  },
];

function RolesTableSkeleton() {
  return (
    <div className="space-y-4 py-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-10" />
        </div>
      ))}
    </div>
  );
}

/** Workspace roles; clicking a row opens the details drawer. */
export function RolesTable({
  roles,
  isLoading,
  onSelect,
  onEdit,
  onDelete,
}: RolesTableProps) {
  const t = useTranslations("settings.roles.table");
  const columns = getColumns(t, onEdit, onDelete);
  return (
    <Card>
      <CardContent>
        {isLoading ? (
          <RolesTableSkeleton />
        ) : roles.length === 0 ? (
          <EmptyState
            compact
            icon={ShieldCheck}
            title={t("noRolesTitle")}
            description={t("noRolesDescription")}
          />
        ) : (
          <SimpleTable
            columns={columns}
            rows={roles}
            getRowKey={(role) => role.slug}
            onRowClick={onSelect}
          />
        )}
      </CardContent>
    </Card>
  );
}
