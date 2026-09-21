"use client";
// coding-standard: maintained

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/ui/components/button";
import { DateCell } from "@/ui/components/dataTable/cells/date-cell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";

interface HistoryRevision {
  _id: string;
  version: number;
  publishedAt: string;
}

/**
 * Every published version of something the merchant publishes — a builder page,
 * the store's look — newest first, each with Restore. Restoring puts that version
 * into the draft; the live version changes only when the merchant publishes again.
 */
export function RevisionHistoryDialog<R extends HistoryRevision>({
  open,
  onOpenChange,
  description,
  revisions,
  isLoading,
  liveVersion,
  detail,
  onRestore,
  restoring,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  description: string;
  revisions: R[];
  isLoading: boolean;
  /** The version shoppers see now, marked Live; unset when nothing is live. */
  liveVersion?: number;
  /** A short line after the publish date, such as a section count. */
  detail?: (revision: R) => ReactNode;
  onRestore: (version: number) => void;
  restoring: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>History</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
                    <DateCell value={revision.publishedAt} isShowDateOnly={false} className="text-xs" />
                    {detail ? <> · {detail(revision)}</> : null}
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
