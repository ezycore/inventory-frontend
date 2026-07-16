"use client";
// coding-standard: maintained

import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, Copy, ExternalLink, Globe, Lock, Store } from "lucide-react";
import { cn } from "@/ui/lib/utils";
import { Card } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { StatusBadge } from "@/ui/components/status-badge";

/** Strip scheme + trailing slash so a URL reads as a bare host for display. */
const hostOf = (url: string) =>
  url.replace(/^https?:\/\//, "").replace(/\/+$/, "");

export interface StoreStatusCardProps {
  published: boolean;
  displayName: string;
  /** Full storefront URL on the tenant subdomain (`…/shop`), or null pre-slug. */
  subdomainUrl: string | null;
  /** The org's active custom domain host (served at root), else null. */
  customDomain: string | null;
}

/**
 * Top card of the ecommerce dashboard: store name, published state, and the
 * public address. When an active custom domain exists it becomes the primary
 * link (served at the domain root — no `/shop`), and the default subdomain is
 * kept underneath as a fallback so a link the merchant already shared never
 * breaks. An active custom domain always has an issued cert, hence "Secure".
 */
export function StoreStatusCard({
  published,
  displayName,
  subdomainUrl,
  customDomain,
}: StoreStatusCardProps) {
  const customUrl = customDomain ? `https://${customDomain}` : null;
  const primaryUrl = customUrl ?? subdomainUrl;

  const copyUrl = async () => {
    if (!primaryUrl) return;
    try {
      await navigator.clipboard.writeText(primaryUrl);
      toast.success("Store URL copied");
    } catch {
      toast.error("Couldn't copy the URL");
    }
  };

  return (
    <Card className="flex flex-row flex-wrap items-center justify-between gap-4 p-4 shadow-none">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span
          className={cn(
            "grid h-12 w-12 flex-none place-items-center rounded-xl border",
            published
              ? "border-green-200 bg-green-50 text-green-700"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Store className="h-5 w-5" />
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">
              {displayName || "Your store"}
            </span>
            <StatusBadge status={published ? "published" : "offline"} size="sm" />
          </div>

          {primaryUrl ? (
            <>
              <div className="mt-1.5 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 flex-none text-muted-foreground" />
                <a
                  href={primaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-sm font-medium hover:text-primary hover:underline"
                >
                  {hostOf(primaryUrl)}
                </a>
                {customUrl && (
                  <span className="flex flex-none items-center gap-1 text-xs font-semibold text-green-700">
                    <Lock className="h-3 w-3" /> Secure
                  </span>
                )}
              </div>

              {customUrl && subdomainUrl && (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    Default
                  </span>
                  <span className="truncate">{hostOf(subdomainUrl)}</span>
                </div>
              )}

              {!customUrl && (
                <Link
                  href="/settings/domains"
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  Connect a custom domain <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </>
          ) : (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Publish your store to get a public address.
            </p>
          )}
        </div>
      </div>

      {primaryUrl && (
        <div className="flex flex-none items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyUrl}
            aria-label="Copy store URL"
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
          </Button>
          <Button size="sm" asChild>
            <a href={primaryUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> View store
            </a>
          </Button>
        </div>
      )}
    </Card>
  );
}
