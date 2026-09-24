"use client";
// coding-standard: maintained

import type { ReactNode } from "react";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { BarChart3 } from "lucide-react";
import type { StorefrontPageListItem } from "@/services/api";
import { storefrontUrl } from "@/lib/storefront-url";
import { StatusBadge } from "@/ui/components/status-badge";
import { PageRowActions } from "./page-row-actions";
import { pageStatus } from "./page-status";

/** A page's path on the shop. A campaign page has none of its own — it lives at its campaign's. */
export function pageAddress(page: Pick<StorefrontPageListItem, "kind" | "slug">): string | null {
  if (page.kind === "campaign" || !page.slug) return null;
  return `/pages/${page.slug}`;
}

/**
 * One page in the Pages list — the same row for a store page, a landing page and
 * a campaign's page, so the screen reads as one list rather than three widgets.
 *
 * The title opens the editor (the one thing merchants do most); everything else
 * is behind ⋯. On a phone the row is a stack — badge beside the title, address
 * and last edit under it; from `md` the status and last edit take columns so a
 * long list can be scanned down. A landing page's order count stays under its
 * title at every width: no other kind has orders, so an Orders column would be
 * a column of dashes.
 */
export function PageRow({
  page,
  icon,
  storeSlug,
  showOrders,
}: {
  page: StorefrontPageListItem;
  icon: ReactNode;
  storeSlug?: string;
  /** Landing pages carry ad attribution; the other kinds have no orders to count. */
  showOrders?: boolean;
}) {
  const status = pageStatus(page);
  const address = pageAddress(page);
  const liveUrl =
    storeSlug && address && page.status === "published" ? `${storefrontUrl(storeSlug)}${address}` : null;
  const edited = `Edited ${formatDistanceToNowStrict(new Date(page.updatedAt), { addSuffix: true })}`;
  const changes = page.status === "published" && page.hasDraft;

  return (
    <li className="flex items-center gap-3 py-3 pl-4 pr-1.5 md:pr-3">
      <span
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
      >
        {icon}
      </span>

      <Link
        href={`/ecommerce/pages/${page._id}`}
        className="grid min-w-0 flex-1 gap-0.5 md:grid-cols-[minmax(0,1fr)_10rem_9rem] md:items-center md:gap-4"
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="truncate text-[15px] font-semibold md:text-sm">{page.title}</span>
            <StatusBadge status={status.variant} label={status.label} className="shrink-0 md:hidden" />
            {page.isHome ? (
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">Homepage</span>
            ) : null}
          </span>
          <span className="block truncate text-[13px] text-muted-foreground md:text-xs">
            {address ? <span className="font-mono text-xs">{address}</span> : "At the campaign's own link"}
            <span className="md:hidden"> · {status.note ?? edited}</span>
          </span>
          {changes ? (
            <span className="mt-0.5 flex items-center gap-1.5 text-xs text-primary md:hidden">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Unpublished changes
            </span>
          ) : null}
          {showOrders ? (
            <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted-foreground md:text-xs">
              <BarChart3 className="h-3.5 w-3.5" aria-hidden />
              <span className="font-semibold text-foreground">{page.orders}</span>
              {page.orders === 1 ? "order" : "orders"} from this page
            </span>
          ) : null}
        </span>

        <span className="hidden flex-col items-start gap-1 md:flex">
          <StatusBadge status={status.variant} label={status.label} />
          {status.note ? <span className="text-xs text-muted-foreground">{status.note}</span> : null}
          {changes ? <span className="text-xs text-primary">Unpublished changes</span> : null}
        </span>
        <span className="hidden text-xs text-muted-foreground md:block">{edited}</span>
      </Link>

      <PageRowActions page={page} address={address} liveUrl={liveUrl} />
    </li>
  );
}
