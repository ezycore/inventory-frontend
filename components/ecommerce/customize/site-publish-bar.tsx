"use client";
// coding-standard: maintained

import { useState } from "react";
import { History, Loader2 } from "lucide-react";
import { getReadyMadeTheme } from "@/lib/storefront-themes";
import {
  useDiscardStorefrontPageDraft,
  useDiscardStorefrontSiteDraft,
  usePublishStorefrontPage,
  usePublishStorefrontSite,
  useRestoreStorefrontSiteRevision,
  useStoreHomePageRow,
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
  const publishHome = usePublishStorefrontPage();
  const discardHome = useDiscardStorefrontPageDraft();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const { data: revisions = [], isLoading } = useStorefrontSiteRevisions(historyOpen);
  /* The home page a theme started (Themes → Apply → "start the home page from
     this theme") goes live, or goes away, WITH the look — one decision. Only
     while its draft is still exactly the theme's: an edit by hand clears
     `draftTheme`, and that draft is then published from the page editor like
     any other, never swept up from here. */
  const homeRow = useStoreHomePageRow();
  const { themeHome } = homeRow;
  const themeLabel = getReadyMadeTheme(themeHome?.draftTheme)?.label;
  const themeName = themeLabel ? `the ${themeLabel} theme` : "a theme";
  /* Publish and Discard act on the home row, so they wait until it is known and
     current: on a reload, or while the list refetches after Apply, acting early
     would make the look live and leave the theme's home behind. A failed
     lookup holds them too, with a retry. */
  const homeLookupFailed = !homeRow.isFetching && homeRow.isError;
  const homeUnknown = homeRow.isFetching || homeLookupFailed;
  const busy =
    publish.isPending || discard.isPending || restore.isPending || publishHome.isPending || discardHome.isPending;
  const hasDraft = site.draft !== null || !!themeHome;

  /* The look first, then the home page: if the second fails, shoppers have the
     new look over their old home — a working shop — and the home is still
     waiting here to publish. Each mutation reports its own error.

     The home goes by the `draftVersion` its row saw, and the server refuses a
     draft saved since — the merchant editing Home in another tab — rather than
     publishing or discarding it. The row is read again after any failure, so
     the bar stops naming a theme the draft no longer is. */
  const publishAll = async () => {
    try {
      if (site.draft) await publish.mutateAsync();
      if (themeHome) await publishHome.mutateAsync({ id: themeHome._id, draftVersion: themeHome.draftVersion });
    } catch {
      // Reported by the mutation that failed.
      void homeRow.refetch();
    }
  };
  const discardAll = async () => {
    try {
      if (site.draft) await discard.mutateAsync();
      if (themeHome) await discardHome.mutateAsync({ id: themeHome._id, draftVersion: themeHome.draftVersion });
    } catch {
      // Reported by the mutation that failed.
      void homeRow.refetch();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border bg-card px-3.5 py-2.5 shadow-sm">
      {hasDraft ? (
        <span role="status" className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-500">
          <span className="h-1.5 w-1.5 flex-none rounded-full bg-amber-500" />
          {themeHome
            ? `Unpublished changes, including your home page started from ${themeName} — shoppers still see the last published version`
            : "Unpublished changes — shoppers still see the last published look"}
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
            disabled={busy || unsavedEdits || homeUnknown}
            onClick={() => setConfirmingDiscard(true)}
          >
            Discard changes
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          disabled={busy || unsavedEdits || homeUnknown || !hasDraft}
          onClick={() => void publishAll()}
        >
          {publish.isPending || publishHome.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
          {hasDraft ? "Publish changes" : "Published"}
        </Button>
      </span>
      {unsavedEdits ? (
        <span className="basis-full text-xs text-muted-foreground">
          Save your changes to publish them.
        </span>
      ) : null}
      {homeLookupFailed ? (
        <span role="alert" className="flex basis-full flex-wrap items-center gap-x-2 text-xs text-destructive">
          Couldn&apos;t check your home page, so publishing waits.
          <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => void homeRow.refetch()}>
            Try again
          </Button>
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
        description={
          themeHome
            ? `Your store's look goes back to what shoppers see now, and your home page goes back to its live version instead of the layout from ${themeName}. Everything saved since the last publish is lost.`
            : "Your store's look goes back to what shoppers see now. Everything saved since the last publish is lost."
        }
        actionLabel="Discard"
        destructive
        onConfirm={() => {
          setConfirmingDiscard(false);
          void discardAll();
        }}
      />
    </div>
  );
}
