"use client";
// coding-standard: maintained

import Link from "next/link";
import { ExternalLink, House, PencilRuler } from "lucide-react";
import { useStorefrontPages } from "@/services/api";
import { useAuthStore } from "@/services/stores";
import { storefrontUrl } from "@/lib/storefront-url";
import { Button } from "@/ui/components/button";
import { StatusBadge } from "@/ui/components/status-badge";
import { pageStatus } from "./page-status";

/** A sketch of a shop's front page — a header, a banner, a product grid. Decoration only. */
function HomeSketch() {
  return (
    <div
      aria-hidden
      className="flex h-24 w-[76px] shrink-0 flex-col gap-1 rounded-lg border bg-muted p-1.5 md:h-20 md:w-32"
    >
      <div className="h-1.5 w-3/5 rounded-full bg-muted-foreground/30" />
      <div className="h-7 rounded bg-primary/20 md:h-6" />
      <div className="grid flex-1 grid-cols-2 gap-1 md:grid-cols-4">
        <div className="rounded-sm bg-muted-foreground/15" />
        <div className="rounded-sm bg-muted-foreground/15" />
        <div className="rounded-sm bg-muted-foreground/15" />
        <div className="rounded-sm bg-muted-foreground/15" />
      </div>
    </div>
  );
}

/**
 * The store's home page, when it is a builder page — moved there from the
 * Customize home (backend `storefrontMigrationService.moveHome`). It is not a
 * landing page, so it has a card of its own rather than a row: it cannot be
 * duplicated, turned off or deleted, only edited. It heads the screen at every
 * width — the page every shopper sees first — as a stacked card on a phone and a
 * single strip from `md`.
 */
export function HomePageCard() {
  const storeSlug = useAuthStore((s) => s.user?.organization?.slug);
  const { data } = useStorefrontPages({ kind: "system", limit: 10 });
  const home = data?.items.find((page) => page.systemKey === "home");
  if (!home) return null;

  const address = storeSlug ? storefrontUrl(storeSlug) : null;
  const status = pageStatus(home);

  return (
    <div className="overflow-hidden rounded-xl border bg-card md:flex md:items-center md:gap-4 md:p-4">
      <div className="flex min-w-0 flex-1 gap-3.5 p-3.5 md:p-0">
        <HomeSketch />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <div className="flex items-center gap-2">
            <House className="h-4 w-4 text-muted-foreground" aria-hidden />
            <span className="font-semibold">Home page</span>
            <StatusBadge status={status.variant} label={status.label} />
          </div>
          {address ? (
            <span className="truncate font-mono text-xs text-muted-foreground">
              {address.replace(/^https?:\/\//, "")}
            </span>
          ) : null}
          <span className="text-[13px] text-muted-foreground">
            {home.hasDraft ? (
              <span className="flex items-center gap-1.5 text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Unpublished changes
              </span>
            ) : (
              "What shoppers see first."
            )}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 px-3.5 pb-3.5 md:flex md:shrink-0 md:p-0">
        <Button asChild className="h-11 md:h-9">
          <Link href={`/ecommerce/pages/${home._id}`}>
            <PencilRuler className="mr-1.5 h-4 w-4" />
            Edit
          </Link>
        </Button>
        {address ? (
          <Button asChild variant="outline" className="h-11 md:h-9">
            <a href={address} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1.5 h-4 w-4" />
              View store
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
