"use client";
// coding-standard: maintained

import { SimpleTable, type SimpleColumn } from "@ui/components/simple-table";
import type { ImportResult, ImportRowError } from "@/types/DataTable";

const errorColumns: SimpleColumn<ImportRowError>[] = [
  {
    key: "row",
    header: "Row",
    cell: (r) => (r.row > 0 ? r.row : "—"),
    headClassName: "w-16",
  },
  {
    key: "errors",
    header: "Errors",
    cell: (r) => r.errors.join("; "),
    // Table cells are `whitespace-nowrap` by default; long messages must wrap
    // or they widen the dialog's grid track and push the footer out of the panel.
    cellClassName: "whitespace-normal break-words",
  },
];

/** A preview's counts, notes and row errors — the read-only half of the import dialog. */
export function ImportResultSummary({ result }: { result: ImportResult }) {
  const hiddenErrors = result.invalid - result.errors.length;

  return (
    <>
      <div className="flex flex-wrap gap-4 text-sm">
        <span>Total rows: <b>{result.total}</b></span>
        <span className="text-green-600">Valid: <b>{result.valid}</b></span>
        <span className="text-amber-600" title="Records that already exist (matched an existing record) and were left unchanged — import creates, it never updates.">
          Skipped (already exist): <b>{result.skipped}</b>
        </span>
        <span className="text-red-600">Invalid: <b>{result.invalid}</b></span>
      </div>

      {result.warnings && result.warnings.length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          {/* Not only skips any more: also what auto-create will add, and how
              many products a file of variant rows reads as. */}
          <p className="mb-1 font-medium">Notes on this file:</p>
          <ul className="list-disc space-y-0.5 pl-5">
            {result.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {result.errors.length > 0 && (
        <div className="max-h-64 overflow-auto rounded-md border">
          <SimpleTable
            columns={errorColumns}
            rows={result.errors}
            getRowKey={(_, index) => index}
          />
        </div>
      )}
      {hiddenErrors > 0 && (
        <p className="text-xs text-muted-foreground">
          Showing first {result.errors.length} of {result.invalid} errors.
        </p>
      )}
    </>
  );
}
