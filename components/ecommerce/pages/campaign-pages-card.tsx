"use client";
// coding-standard: maintained

import Link from "next/link";
import { ExternalLink, PencilRuler, Tag } from "lucide-react";
import { useStorefrontPages } from "@/services/api";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";

/**
 * The pages merchants made for their sales — one per campaign, each served at
 * that campaign's own address (`/campaigns/<slug>`).
 *
 * A card rather than a row in the Store pages table, for the same reason the
 * shop's built-in pages have one: none of that table's columns says anything
 * about them. They have no address of their own to edit (it is the campaign's),
 * and their schedule is the campaign's window rather than a page schedule.
 *
 * **Absent until a merchant makes one**, which most never will: a campaign's
 * address already draws the sale's banner and products without a page, and the
 * page is offered at create time for the merchant who wants to sell the sale —
 * testimonials, a video, their own headline.
 *
 * A campaign page is deleted with its campaign, never from here: the address
 * belongs to the campaign, so a page outliving it would be unreachable and still
 * editable.
 */
export function CampaignPagesCard() {
  const { data } = useStorefrontPages({ kind: "campaign", limit: 50 });
  const pages = data?.items ?? [];
  if (pages.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card">
      <div className="border-b px-4 py-3">
        <p className="text-sm font-semibold">Campaign pages ({pages.length})</p>
        <p className="text-xs text-muted-foreground">
          One per sale, at the campaign&apos;s own link. Deleting the campaign removes its page.
        </p>
      </div>
      <ul className="divide-y">
        {pages.map((page) => (
          <li key={page._id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <Tag className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                {page.title}
                {page.hasDraft ? (
                  <Badge variant="outline" className="text-[11px] font-normal">
                    Unpublished changes
                  </Badge>
                ) : null}
              </p>
              <p className="text-xs text-muted-foreground">
                The page shoppers land on from this campaign&apos;s link.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/ecommerce/pages/${page._id}`}>
                <PencilRuler className="mr-1.5 h-4 w-4" />
                Open editor
              </Link>
            </Button>
            {/* Straight to the campaign list, where Copy link is — the page's
                own address is the campaign's, so that is where it is read. */}
            <Button asChild variant="ghost" size="sm">
              <Link href="/ecommerce/campaigns">
                <ExternalLink className="mr-1.5 h-4 w-4" />
                Campaigns
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
