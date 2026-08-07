// coding-standard: maintained
import type { Campaign } from "@/services/api";
import { DiscountCell } from "@/components/ecommerce/discount-cell";
import { LifecycleBadge } from "@/components/ecommerce/lifecycle-badge";
import { DateCell } from "@/ui/components/dataTable/cells";
import type { ColumnDef } from "@tanstack/react-table";
import { CAMPAIGN_SCOPE_LABEL, type CampaignScope } from "./form-config";

export const campaignColumns: ColumnDef<Campaign>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: "scope",
    header: "Scope",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {CAMPAIGN_SCOPE_LABEL[row.original.scope as CampaignScope] ??
          row.original.scope}
      </span>
    ),
  },
  {
    accessorKey: "value",
    header: "Discount",
    cell: ({ row }) => (
      <DiscountCell type={row.original.type} value={row.original.value} />
    ),
  },
  {
    accessorKey: "startsAt",
    header: "Window",
    cell: ({ row }) => {
      const c = row.original;
      return (
        <span className="flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
          <DateCell value={c.startsAt} className="text-xs" />
          <span>→</span>
          <DateCell value={c.endsAt} className="text-xs" />
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <LifecycleBadge
        status={row.original.status}
        startsAt={row.original.startsAt}
        endsAt={row.original.endsAt}
      />
    ),
  },
];
