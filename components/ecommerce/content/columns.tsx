// coding-standard: maintained
import type { ContentPage } from "@/services/api";
import { StatusBadge } from "@/ui/components/status-badge";
import { storefrontUrl } from "@/lib/storefront-url";
import { PREVIEW_TOKEN_PARAM } from "@/lib/storefront-preview";
import type { ColumnDef } from "@tanstack/react-table";

/**
 * The storefront URL for one page, carrying the owner-preview credential.
 *
 * The token is what makes a DRAFT viewable: the public read filters on
 * `published`, and `resolveStoreContext` relaxes that filter — and only that
 * filter — for a verified owner. Without it the merchant's only way to see a
 * Return Policy was to publish the unchecked version first.
 *
 * `preview=1` is deliberately NOT set. That flag turns on the Customize editor's
 * live-theme bridge, which this link has nothing to send; it would also make the
 * response `no-store` and bypass ISR for no benefit.
 */
function pagePreviewHref(slug: string, pageSlug: string, token?: string): string {
  const base = `${storefrontUrl(slug)}/pages/${pageSlug}`;
  return token ? `${base}?${PREVIEW_TOKEN_PARAM}=${encodeURIComponent(token)}` : base;
}

/**
 * `storeSlug`/`previewToken` are resolved once by the page and threaded in, so
 * the token is fetched a single time rather than by a hook inside every row's
 * cell.
 */
export function buildContentColumns({
  storeSlug,
  previewToken,
}: {
  storeSlug?: string;
  previewToken?: string;
}): ColumnDef<ContentPage>[] {
  return [
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
    {
      id: "preview",
      header: "Preview",
      enableSorting: false,
      cell: ({ row }) => {
        // No slug means no storefront host to point at — render nothing rather
        // than a link that 404s.
        if (!storeSlug) return <span className="text-muted-foreground">—</span>;
        return (
          <a
            href={pagePreviewHref(storeSlug, row.original.slug, previewToken)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline"
          >
            {row.original.published ? "View" : "Preview draft"}
          </a>
        );
      },
    },
  ];
}

/** Static columns — no store slug, so the preview cell renders as a dash. */
export const contentColumns: ColumnDef<ContentPage>[] = buildContentColumns({});
