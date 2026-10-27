"use client";
// coding-standard: maintained

import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useGetProductFeedSettings, useUpdateProductFeedSettings } from "@/services/api";
import { useDomains } from "@/services/api/modules/domains/hooks";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { storefrontUrl } from "@/lib/storefront-url";
import type { ProductFeedSettings } from "@/types/api";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Separator } from "@/ui/components/separator";
import { Skeleton } from "@/ui/components/skeleton";
import { copyText } from "@/utils/clipboard";
import { Field, SaveBar, ToggleRow, useReportDirty } from "./settings-form-shared";

/**
 * Product feed (backend `docs/plan/product-feed.md`): one switch and the link to paste into
 * Facebook Commerce Manager, Google Merchant Center, TikTok or Pinterest. Named for what it
 * carries — every one of those readers takes the same file.
 */

const FEED_PATH = "/feeds/products.xml";

/**
 * The feed lives at the root of the store's canonical host: the custom domain once it is active
 * (the subdomain 301s there), otherwise the `*.ezycore.com` subdomain — not under `/shop`.
 */
function useFeedUrl(): string | null {
  const slug = useAuthStore((s) => s.user?.organization?.slug);
  const { data: domains } = useDomains();
  const custom = (domains ?? []).find((d) => d.type === "custom" && d.status === "active")?.domain;
  if (custom) return `https://${custom}${FEED_PATH}`;
  if (!slug) return null;
  return `${new URL(storefrontUrl(slug), "https://placeholder.invalid").origin}${FEED_PATH}`;
}

export function ProductFeedCard({ onDirtyChange }: { onDirtyChange?: (dirty: boolean) => void }) {
  const { data: settings, isLoading } = useGetProductFeedSettings();
  if (isLoading || !settings) return <Skeleton className="h-48 w-full" />;
  return <ProductFeedForm settings={settings} onDirtyChange={onDirtyChange} />;
}

function ProductFeedForm({
  settings,
  onDirtyChange,
}: {
  settings: ProductFeedSettings;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const update = useUpdateProductFeedSettings();
  const [enabled, setEnabled] = useState(settings.enabled);
  const feedUrl = useFeedUrl();
  useReportDirty(enabled !== settings.enabled, onDirtyChange);

  const copy = () => {
    if (!feedUrl) return;
    copyText(feedUrl).then(
      () => toast.success("Feed link copied"),
      () => toast.error("Could not copy"),
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        A link that lists your products — photos, prices, stock and the page link — for Facebook
        and Instagram catalogs, Google Shopping, TikTok and Pinterest. They re-read it every day, so
        new products, price changes and sold-out items update there on their own.
      </p>

      <ToggleRow
        label="Enable product feed"
        desc="Off by default. Turning it on makes your product list readable at the link below."
        checked={enabled}
        onChange={setEnabled}
      />

      {settings.enabled && feedUrl ? (
        <>
          <Separator />
          <Field label="Feed link">
            <div className="flex gap-2">
              <Input value={feedUrl} readOnly className="font-mono text-xs" onFocus={(e) => e.target.select()} />
              <Button type="button" variant="outline" size="icon" onClick={copy} aria-label="Copy feed link">
                <Copy className="size-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" asChild>
                <a href={feedUrl} target="_blank" rel="noreferrer" aria-label="Open feed link">
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            </div>
          </Field>
          <div className="space-y-1 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            <p>
              <strong>Facebook &amp; Instagram:</strong> Commerce Manager → Catalog → Data sources →
              Data feed → Scheduled feed → paste the link, repeat daily.
            </p>
            <p>
              <strong>Google:</strong> Merchant Center → Products → Add product source → Add products
              from a file → enter the link, fetch daily.
            </p>
            <p>
              Products hidden from your online store are left out, and a product needs a photo and a
              price to be listed. Sold-out products stay in as out of stock.
            </p>
          </div>
        </>
      ) : null}

      <SaveBar onSave={() => update.mutate({ enabled })} pending={update.isPending} />
    </div>
  );
}
