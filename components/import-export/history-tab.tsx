"use client";
// coding-standard: maintained

import Link from "next/link";
import { useTranslations } from "next-intl";
import { LIST_PAGE_SIZES, ListPagination } from "@/components/ecommerce/list-pagination";
import { useFormatters } from "@/hooks/use-formatters";
import { useListUrlState } from "@/hooks/use-list-url-state";
import { useImportBatches, useMigrations } from "@/services/api";
import type { ImportBatch } from "@/types/api";
import { Card } from "@ui/components/card";
import { SimpleTable, type SimpleColumn } from "@ui/components/simple-table";
import { Skeleton } from "@ui/components/skeleton";

/**
 * What came in and why some of it did not (backend `import-batch.service.ts`):
 * every committed CSV import, then every move from WooCommerce — a migration is
 * one entry, however many pages it imported.
 */
export function HistoryTab({ showMigrations }: { showMigrations: boolean }) {
  const t = useTranslations("importExport.history");
  const tRun = useTranslations("products.products.migrate.run");
  const { formatDateTime } = useFormatters();
  const list = useListUrlState({ defaults: { limit: 20, filters: {} }, limitOptions: LIST_PAGE_SIZES, prefix: "h_" });
  const { data, isLoading, isFetching } = useImportBatches({ page: list.page, limit: list.limit });
  const migrations = useMigrations();
  const moves = (migrations.data ?? []).filter((run) => run.source === "woocommerce_rest");

  const columns: SimpleColumn<ImportBatch>[] = [
    { key: "when", header: t("columns.when"), cell: (row) => formatDateTime(row.createdAt) },
    { key: "what", header: t("columns.what"), cell: (row) => t(`resources.${row.resource}`) },
    {
      key: "file",
      header: t("columns.file"),
      cell: (row) => (
        <div className="min-w-0">
          <span className="break-all">{row.filename}</span>
          {row.rowErrors?.length ? <FailedRows rows={row.rowErrors} /> : null}
        </div>
      ),
    },
    { key: "by", header: t("columns.by"), cell: (row) => row.importedBy?.name ?? "—" },
    { key: "created", header: t("columns.created"), align: "right", cell: (row) => row.created },
    { key: "skipped", header: t("columns.skipped"), align: "right", cell: (row) => row.skipped },
    { key: "failed", header: t("columns.failed"), align: "right", cell: (row) => row.failed },
  ];

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("importsTitle")}</h2>
        <Card className="overflow-hidden">
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : !data?.items?.length ? (
            <p className="p-6 text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <>
              <SimpleTable columns={columns} rows={data.items} getRowKey={(row) => row._id} />
              <ListPagination
                page={data.page}
                totalPages={data.totalPages}
                limit={list.limit}
                total={data.total}
                onPageChange={list.setPage}
                onLimitChange={list.setLimit}
                isFetching={isFetching}
              />
            </>
          )}
        </Card>
      </section>

      {showMigrations && moves.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t("migrationsTitle")}</h2>
          <ul className="space-y-2">
            {moves.map((run) => (
              <li key={run._id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
                <div>
                  <div className="font-medium">{run.storeUrl ? tRun("from", { store: run.storeUrl }) : run.source}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(run.createdAt)} · {statusLabel(run.status, tRun)}
                  </div>
                </div>
                <Link className="text-primary hover:underline" href={`/import-export?tab=move&run=${run._id}`}>
                  {t("open")}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** The run screen's own words for where a migration stands. */
function statusLabel(status: string, tRun: (key: string) => string): string {
  if (status === "done") return tRun("done");
  if (status === "failed") return tRun("failed");
  if (status === "canceled") return tRun("canceled");
  if (status === "previewed") return tRun("previewTitle");
  return tRun("importing");
}

function FailedRows({ rows }: { rows: NonNullable<ImportBatch["rowErrors"]> }) {
  const t = useTranslations("importExport.history");
  return (
    <details className="mt-1 text-xs">
      <summary className="cursor-pointer text-destructive">{t("showFailed", { count: rows.length })}</summary>
      <ul className="mt-1 space-y-0.5 text-muted-foreground">
        {rows.map((row) => (
          <li key={row.row}>
            {t("row", { row: row.row })}: {row.messages.join("; ")}
          </li>
        ))}
      </ul>
    </details>
  );
}
