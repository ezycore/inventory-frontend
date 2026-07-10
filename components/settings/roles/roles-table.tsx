"use client";
// coding-standard: maintained

import { ChevronRight, Lock, ShieldCheck } from "lucide-react";
import { Badge } from "@/ui/components/badge";
import { Card, CardContent } from "@/ui/components/card";
import EmptyState from "@/ui/components/EmptyState";
import { SimpleTable, type SimpleColumn } from "@/ui/components/simple-table";
import { Skeleton } from "@/ui/components/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/ui/components/tooltip";
import type { OrganizationRole } from "@/types/users";

interface RolesTableProps {
  roles: OrganizationRole[];
  isLoading: boolean;
  onSelect: (role: OrganizationRole) => void;
}

const columns: SimpleColumn<OrganizationRole>[] = [
  {
    key: "role",
    header: "Role",
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
                  Locked role — cannot be modified in this workspace
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
    header: "Description",
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
    header: "Source",
    headClassName: "hidden sm:table-cell",
    cellClassName: "hidden sm:table-cell",
    cell: (role) => (
      <Badge variant={role.source === "system" ? "secondary" : "outline"}>
        {role.source === "system" ? "System" : "Mission Control"}
      </Badge>
    ),
  },
  {
    key: "permissions",
    header: "Permissions",
    align: "right",
    cell: (role) => (
      <Badge variant="outline" className="tabular-nums">
        {role.permissions.length}
      </Badge>
    ),
  },
  {
    key: "open",
    header: <span className="sr-only">Open</span>,
    align: "right",
    headClassName: "w-10",
    cell: () => (
      <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
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

/** Read-only list of workspace roles; clicking a row opens the details drawer. */
export function RolesTable({ roles, isLoading, onSelect }: RolesTableProps) {
  return (
    <Card>
      <CardContent>
        {isLoading ? (
          <RolesTableSkeleton />
        ) : roles.length === 0 ? (
          <EmptyState
            compact
            icon={ShieldCheck}
            title="No roles synced"
            description="Roles are managed in Mission Control and appear here once synced to this workspace."
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
