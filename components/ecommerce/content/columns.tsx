import type { ContentPage } from "@/services/api";
import { StatusBadge } from "@/ui/components/status-badge";
import type { ColumnDef } from "@tanstack/react-table";

export const contentColumns: ColumnDef<ContentPage>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
  },
  {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) => (
      <span className="font-mono text-muted-foreground">/{row.original.slug}</span>
    ),
  },
  {
    accessorKey: "published",
    header: "Published",
    cell: ({ row }) => (
      <StatusBadge status={row.original.published ? "published" : "draft"} />
    ),
  },
  {
    accessorKey: "showInFooter",
    header: "Footer",
    cell: ({ row }) => {
      const p = row.original;
      return (
        <span className="text-muted-foreground">
          {p.published && p.showInFooter ? "Yes" : "—"}
        </span>
      );
    },
  },
];
