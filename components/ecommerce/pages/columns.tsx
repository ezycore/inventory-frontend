// coding-standard: maintained
import type { ColumnDef } from "@tanstack/react-table";
import type { StorefrontPageListItem } from "@/services/api";
import { storefrontUrl } from "@/lib/storefront-url";
import { StatusBadge } from "@/ui/components/status-badge";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";

/** A builder page's address on the shop. */
const pagePath = (slug?: string) => (slug ? `/pages/${slug}` : "");

/**
 * `storeSlug` is resolved once by the page and threaded in, so no row cell reads
 * the auth store.
 */
export function buildPageColumns({
  storeSlug,
}: {
  storeSlug?: string;
}): ColumnDef<StorefrontPageListItem>[] {
  return [
    {
      accessorKey: "title",
      header: "Page",
      cell: ({ row }) => {
        const page = row.original;
        return (
          <div className="min-w-0">
            <div className="font-medium">{page.title}</div>
            {/* A live page with edits nobody has published yet — the one state a
                merchant cannot see from the shop. */}
            {page.status === "published" && page.hasDraft ? (
              <div className="text-xs text-muted-foreground">Unpublished changes</div>
            ) : null}
          </div>
        );
      },
    },
    {
      accessorKey: "slug",
      header: "Address",
      cell: ({ row }) => (
        <span className="font-mono text-muted-foreground">
          {pagePath(row.original.slug) || "—"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "updatedAt",
      header: "Last edited",
      cell: ({ row }) => <DateCell value={row.original.updatedAt} isShowDateOnly={false} />,
    },
    {
      id: "view",
      header: "Live page",
      enableSorting: false,
      cell: ({ row }) => {
        const page = row.original;
        // Only a published page has anything a shopper can open; a draft is
        // previewed from the editor.
        if (!storeSlug || page.status !== "published" || !page.slug) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <a
            href={`${storefrontUrl(storeSlug)}${pagePath(page.slug)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline"
          >
            View
          </a>
        );
      },
    },
  ];
}
