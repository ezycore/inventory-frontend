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
import { formatRoleName } from "./helpers";

// Column definitions
export const getUserColumns = (
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
