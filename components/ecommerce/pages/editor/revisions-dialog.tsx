"use client";
// coding-standard: maintained

import { useStorefrontPageRevisions, type StorefrontPage } from "@/services/api";
import { RevisionHistoryDialog } from "@/components/ecommerce/revision-history-dialog";

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

  return (
    <RevisionHistoryDialog
      open={open}
      onOpenChange={onOpenChange}
      description="Each publish is kept, up to the last 20. Restoring a version puts it into your draft — the live page changes when you publish."
      revisions={revisions}
      isLoading={isLoading}
      liveVersion={page.status === "published" ? page.published?.version : undefined}
      detail={(revision) =>
        `${revision.sectionCount} ${revision.sectionCount === 1 ? "section" : "sections"}`
      }
      onRestore={onRestore}
      restoring={restoring}
    />
  );
}
