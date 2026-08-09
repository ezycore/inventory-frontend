"use client";
// coding-standard: maintained

import { useState } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink } from "lucide-react";
import { storefrontUrl } from "@/lib/storefront-url";
import { useAuthStore } from "@/services/stores/use-auth-store";
import type { StorefrontSettings } from "@/types";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Switch } from "@/ui/components/switch";
import { SaveBar, useSave } from "./settings-primitives";

/**
 * Store Settings → Publish: the live switch, the public URL, and the
 * fulfillment-location precondition.
 *
 * The switch is disabled until a fulfillment location exists (`!locationSet &&
 * !published`) — but only for turning the store ON. A published store can always
 * be taken back down, whatever its configuration.
 *
 * The favicon note below is advisory and never blocks publishing. It earns its
 * place because the consequence is invisible from the admin app: with no org
 * favicon the shop's browser tab shows the *platform* mark on the merchant's own
 * domain, and the favicon deliberately has no logo fallback to paper over it.
 */
export function PublishTab({ settings }: { settings: StorefrontSettings }) {
  const { save, pending } = useSave();
  const [published, setPublished] = useState(settings.published);
  const slug = useAuthStore((s) => s.user?.organization?.slug);
  const hasFavicon = useAuthStore((s) => !!s.user?.organization?.favicon);
  const liveUrl = slug ? storefrontUrl(slug) : null;
  const locationSet = !!settings.storefrontLocationId;

  const copy = async () => {
    if (!liveUrl) return;
    try {
      await navigator.clipboard.writeText(liveUrl);
      toast.success("Store URL copied");
    } catch {
      toast.error("Couldn't copy the URL");
    }
  };

  return (
    <div className="space-y-5">
      <Card className="space-y-4 p-5 shadow-none">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold">Store status</h3>
            <p className="text-xs text-muted-foreground">
              When live, customers can browse and place orders.
            </p>
          </div>
          <Switch
            checked={published}
            disabled={!locationSet && !published}
            onCheckedChange={setPublished}
          />
        </div>

        {liveUrl && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted px-3 py-2.5">
            <span className="text-xs text-muted-foreground">Public URL</span>
            <code className="flex-1 break-all text-xs font-semibold">
              {liveUrl}
            </code>
            <Button variant="outline" size="sm" onClick={copy}>
              <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={liveUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Visit
              </a>
            </Button>
          </div>
        )}

        {locationSet ? (
          <div className="rounded-lg bg-green-50 px-3.5 py-2.5 text-sm font-medium text-green-800">
            ✓ Fulfillment location is set — you&apos;re ready to publish.
          </div>
        ) : (
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Set a fulfillment location (General tab) before publishing.
          </div>
        )}

        {!hasFavicon && (
          <div className="rounded-lg bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
            No browser tab icon set — your shop&apos;s tab will show the EzyCore
            icon. Add one under Settings → Organization. Your logo is not used
            for this.
          </div>
        )}
      </Card>
      <SaveBar pending={pending} onSave={() => save({ published })} />
    </div>
  );
}
