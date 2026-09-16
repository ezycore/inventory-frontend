// coding-standard: maintained
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import type { StorefrontPageListItem } from "@/services/api";
import { storefrontUrl } from "@/lib/storefront-url";
import { Badge } from "@/ui/components/badge";
import { StatusBadge } from "@/ui/components/status-badge";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import { scheduleSummary } from "./page-schedule";

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
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{page.title}</span>
              {/* The page shoppers see at the store's own address. */}
              {page.isHome ? <Badge variant="secondary">Homepage</Badge> : null}
            </div>
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
      cell: ({ row }) => {
        const page = row.original;
        // "Published" alone would read as live for an offer that has not started
        // or is over; only a published page's schedule decides what shoppers get.
        const schedule = page.status === "published" ? scheduleSummary(page.schedule) : null;
        return (
          <div className="space-y-1">
            <StatusBadge status={page.status} />
            {schedule ? <div className="text-xs text-muted-foreground">{schedule}</div> : null}
          </div>
        );
      },
    },
    {
      accessorKey: "orders",
      header: "Orders",
      cell: ({ row }) => {
        const { _id, orders } = row.original;
        // Every order from a shopper who came through this page, any status; the
        // link opens them in the order list.
        if (!orders) return <span className="text-muted-foreground">0</span>;
        return (
          <Link
            href={`/ecommerce/orders?pageId=${_id}`}
            className="font-medium text-primary hover:underline"
          >
            {orders}
          </Link>
        );
      },
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
