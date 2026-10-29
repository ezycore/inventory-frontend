"use client";
// coding-standard: maintained

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@ui/components/button";
import { SimpleTable, type SimpleColumn } from "@ui/components/simple-table";
import { invalidate } from "@/services/api/invalidation";
import {
  isMigrationActive,
  useCancelMigration,
  useCommitMigration,
} from "@/services/api";
import type { MigrationRun } from "@/types/api";

type Progress = MigrationRun["progress"][number];

/** Steps in the order the backend runs them; an unknown one is still shown, last. */
const ENTITY_ORDER = ["products", "customers", "orders", "categories"];
const rank = (entity: string) => {
  const index = ENTITY_ORDER.indexOf(entity);
  return index === -1 ? ENTITY_ORDER.length : index;
};

/**
 * One migration, as it moves (backend `docs/plan/data-migration.md`): what the
 * preview found, the import's counts, and the notes it left — skipped
 * variants, buyers with no usable phone, categories it will create. The page
 * polls the run (`useMigration`), so this redraws as the worker goes.
 */
export function MigrationRunView({ run, onStartAnother }: { run: MigrationRun; onStartAnother: () => void }) {
  const t = useTranslations("products.products.migrate.run");
  const qc = useQueryClient();
  const commit = useCommitMigration();
  const cancel = useCancelMigration();
  const active = isMigrationActive(run);
  const previewing = run.stage === "preview";

  // The import writes in the background, so finishing is learned from the
  // poll, not from a mutation: refresh everything it wrote, once.
  const announced = useRef(run.status === "done");
  useEffect(() => {
    if (run.status === "done" && !announced.current) {
      announced.current = true;
      void invalidate(qc, "migration.imported");
    }
  }, [run.status, qc]);

  const act = (action: typeof commit | typeof cancel) => async () => {
    try {
      await action.mutateAsync(run._id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };

  const columns: SimpleColumn<Progress>[] = [
    {
      key: "what",
      header: t("columns.what"),
      cell: (row) => (ENTITY_ORDER.includes(row.entity) ? t(`entities.${row.entity}`) : row.entity),
    },
    { key: "found", header: t("columns.found"), align: "right", cell: (row) => row.total ?? row.processed },
    {
      key: "created",
      header: previewing ? t("columns.willImport") : t("columns.imported"),
      align: "right",
      cell: (row) => row.created,
    },
    { key: "skipped", header: t("columns.skipped"), align: "right", cell: (row) => row.skipped },
    { key: "failed", header: t("columns.failed"), align: "right", cell: (row) => row.failed },
  ];
  const rows = [...run.progress].sort((a, b) => rank(a.entity) - rank(b.entity));

  const heading =
    run.status === "previewed"
      ? t("previewTitle")
      : run.status === "done"
        ? t("done")
        : run.status === "failed"
          ? t("failed")
          : run.status === "canceled"
            ? t("canceled")
            : run.status === "queued" && !run.startedAt
              ? t("queued")
              : previewing
                ? t("reading")
                : t("importing");

  return (
    <div className="space-y-5 rounded-lg border p-4 sm:p-6">
      <div className="flex items-start gap-3">
        {active && <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-muted-foreground" />}
        {run.status === "done" && <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />}
        {run.status === "failed" && <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />}
        <div className="min-w-0">
          <p className="font-medium">{heading}</p>
          {run.storeUrl && <p className="truncate text-sm text-muted-foreground">{t("from", { store: run.storeUrl })}</p>}
          {run.status === "previewed" && <p className="mt-1 text-sm text-muted-foreground">{t("previewHint")}</p>}
          {run.status === "failed" && run.error && <p className="mt-1 text-sm text-red-600">{run.error}</p>}
          {(run.status === "done" || run.status === "failed" || run.status === "canceled") && (
            <p className="mt-1 text-xs text-muted-foreground">{t("keyDropped")}</p>
          )}
        </div>
      </div>

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <SimpleTable columns={columns} rows={rows} getRowKey={(row) => row.entity} />
        </div>
      )}

      <div>
        <p className="mb-1 text-sm font-medium">{t("notes")}</p>
        {run.warnings.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noNotes")}</p>
        ) : (
          <ul className="max-h-72 list-disc space-y-0.5 overflow-y-auto rounded-md border border-amber-300 bg-amber-50 p-3 pl-7 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
            {run.warnings.map((warning, index) => (
              <li key={index} className="break-words">{warning.message}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {run.status === "previewed" && (
          <Button onClick={act(commit)} disabled={commit.isPending}>
            {commit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("start")}
          </Button>
        )}
        {(active || run.status === "previewed") && (
          <Button variant="outline" onClick={act(cancel)} disabled={cancel.isPending}>
            {t("stop")}
          </Button>
        )}
        {run.status === "done" && (
          <>
            <Button asChild variant="outline">
              <Link href="/products">{t("viewProducts")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/customers">{t("viewCustomers")}</Link>
            </Button>
          </>
        )}
        {!active && run.status !== "previewed" && (
          <Button variant="ghost" onClick={onStartAnother}>
            {t("startAnother")}
          </Button>
        )}
      </div>
    </div>
  );
}
