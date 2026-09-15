"use client";
// coding-standard: maintained

import { Loader2 } from "lucide-react";
import { useStorefrontPageRevisions, type StorefrontPage } from "@/services/api";
import { Button } from "@/ui/components/button";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";

/**
 * Every published version of the page, newest first (the backend keeps the last
 * 20). Restoring one puts it into the draft; the live page changes only when the
 * merchant publishes again.
 */
export function RevisionsDialog({
  page,
  open,
  onOpenChange,
  onRestore,
  restoring,
}: {
  page: StorefrontPage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore: (version: number) => void;
  restoring: boolean;
}) {
  const { data: revisions = [], isLoading } = useStorefrontPageRevisions(page._id, open);
  const liveVersion = page.status === "published" ? page.published?.version : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>History</DialogTitle>
          <DialogDescription>
            Each publish is kept, up to the last 20. Restoring a version puts it into your draft — the
            live page changes when you publish.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : revisions.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">Nothing has been published yet.</p>
        ) : (
          <ol className="divide-y rounded-md border">
            {revisions.map((revision) => (
              <li key={revision._id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    Version {revision.version}
                    {revision.version === liveVersion ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                        Live
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <DateCell value={revision.publishedAt} isShowDateOnly={false} className="text-xs" /> ·{" "}
                    {revision.sectionCount} {revision.sectionCount === 1 ? "section" : "sections"}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={restoring}
                  onClick={() => onRestore(revision.version)}
                >
                  Restore
                </Button>
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}
