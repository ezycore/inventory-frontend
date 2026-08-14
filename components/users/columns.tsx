// coding-standard: maintained
import { ColumnDef } from "@tanstack/react-table";
import type { User } from "@/types/users";
import { Badge } from "@/ui/components/badge";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import LocationCountCell from "@/components/locations/LocationCountCell";
import {
  AlertCircle,
  CheckCircle2,
  Mail,
  MailCheck,
} from "lucide-react";
import type { Translator } from "@/i18n/config";
import { fullName } from "@/utils/user-name";
import { formatRoleName } from "./helpers";

// Column definitions
export const getUserColumns = (
  allLocationRoleSlugs: Set<string>,
  roleLabels: Map<string, string>,
  t: Translator,
): ColumnDef<User>[] => [
  {
    accessorKey: "firstName",
    header: t("columns.name"),
    cell: ({ row }) => {
      const firstName = row.getValue("firstName") as string;
      const lastName = row.original.lastName;
      return (
        <div className="flex items-center gap-2">
          <div>
            <div className="font-medium">{fullName({ firstName, lastName })}</div>
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
    header: t("columns.role"),
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
    header: t("columns.location"),
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
    header: t("columns.status"),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <div className="flex items-center gap-2">
          {status === "active" ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">{t("columns.active")}</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-600 font-medium">{t("columns.inactive")}</span>
            </>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "emailVerified",
    header: t("columns.emailStatus"),
    cell: ({ row }) => {
      const emailVerified = row.getValue("emailVerified") as boolean;
      return (
        <div className="flex items-center gap-2">
          {emailVerified ? (
            <>
              <MailCheck className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">{t("columns.verified")}</span>
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 text-amber-600" />
              <span className="text-amber-600 font-medium">{t("columns.unverified")}</span>
            </>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: t("columns.phone"),
    cell: ({ row }) => row.getValue("phone") || "—",
  },
  {
    accessorKey: "createdAt",
    header: t("columns.createdDate"),
    cell: ({ row }) => <DateCell value={row.getValue("createdAt")} />,
  },
];
