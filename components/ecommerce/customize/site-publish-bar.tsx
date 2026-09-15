"use client";
// coding-standard: maintained

import { useState } from "react";
import { History, Loader2 } from "lucide-react";
import {
  useDiscardStorefrontSiteDraft,
  usePublishStorefrontSite,
  useRestoreStorefrontSiteRevision,
  useStorefrontSiteRevisions,
  type StorefrontSite,
} from "@/services/api";
import { Button } from "@/ui/components/button";
import { OrderConfirmDialog } from "@/components/ecommerce/orders/order-confirm-dialog";
import { RevisionHistoryDialog } from "@/components/ecommerce/revision-history-dialog";

/**
 * Publish, discard and history for a store whose look is published through the
 * Site (backend plan storefront-builder §17, Phase 5). Customize's own Save writes
 * the draft; this bar is what makes it live.
 *
 * Publish and Discard wait while Customize holds unsaved edits: publishing would
 * leave them out, and discarding the saved draft under them would re-seed the
 * editor over the merchant's work.
 */
export function SitePublishBar({
  site,
  unsavedEdits,
}: {
  site: StorefrontSite;
  unsavedEdits: boolean;
}) {
  const publish = usePublishStorefrontSite();
  const discard = useDiscardStorefrontSiteDraft();
  const restore = useRestoreStorefrontSiteRevision();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const { data: revisions = [], isLoading } = useStorefrontSiteRevisions(historyOpen);
  const busy = publish.isPending || discard.isPending || restore.isPending;
  const hasDraft = site.draft !== null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border bg-card px-3.5 py-2.5 shadow-sm">
      {hasDraft ? (
        <span role="status" className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-500">
          <span className="h-1.5 w-1.5 flex-none rounded-full bg-amber-500" />
          Unpublished changes — shoppers still see the last published look
        </span>
      ) : (
        <span role="status" className="text-xs text-muted-foreground">
          Shoppers see your latest version ({site.published.version})
        </span>
      )}
      <span className="ml-auto flex flex-wrap items-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setHistoryOpen(true)}>
          <History className="mr-1.5 h-4 w-4" />
          History
        </Button>
        {hasDraft ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy || unsavedEdits}
            onClick={() => setConfirmingDiscard(true)}
          >
            Discard changes
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          disabled={busy || unsavedEdits || !hasDraft}
          onClick={() => publish.mutate()}
        >
          {publish.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
          {hasDraft ? "Publish changes" : "Published"}
        </Button>
      </span>
      {unsavedEdits ? (
        <span className="basis-full text-xs text-muted-foreground">
          Save your changes to publish them.
        </span>
      ) : null}

      <RevisionHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        description="Each publish of your store's look is kept, up to the last 20. Restoring a version puts it into your draft — shoppers see it when you publish."
        revisions={revisions}
        isLoading={isLoading}
        liveVersion={site.published.version}
        onRestore={(version) =>
          restore.mutate(version, { onSuccess: () => setHistoryOpen(false) })
        }
        restoring={restore.isPending || unsavedEdits}
      />
      <OrderConfirmDialog
        open={confirmingDiscard}
        onOpenChange={(open) => !open && setConfirmingDiscard(false)}
        title="Discard your changes?"
        description="Your store's look goes back to what shoppers see now. Everything saved since the last publish is lost."
        actionLabel="Discard"
        destructive
        onConfirm={() => {
          setConfirmingDiscard(false);
          discard.mutate();
        }}
      />
    </div>
  );
}
