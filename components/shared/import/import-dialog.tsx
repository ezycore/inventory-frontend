"use client";
// coding-standard: maintained

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@ui/components/dialog";
import { Button } from "@ui/components/button";
import { SimpleTable, type SimpleColumn } from "@ui/components/simple-table";
import { Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import type {
  ImportColumnMapping,
  ImportResult,
  ImportRowError,
} from "@/types/DataTable";
import { ColumnMapper } from "./column-mapper";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Trigger a template CSV download. */
  downloadTemplate: () => Promise<void>;
  /** Dry-run: validate the file without writing, return per-row results. */
  preview: (file: File, mapping?: ImportColumnMapping) => Promise<ImportResult>;
  /** Commit valid rows; returns the final result. */
  commit: (file: File, mapping?: ImportColumnMapping) => Promise<ImportResult>;
  /** Called after a successful commit (e.g. refetch the list). */
  onCommitted?: () => void;
}

const errorColumns: SimpleColumn<ImportRowError>[] = [
  {
    key: "row",
    header: "Row",
    cell: (r) => (r.row > 0 ? r.row : "—"),
    headClassName: "w-16",
  },
  { key: "errors", header: "Errors", cell: (r) => r.errors.join("; ") },
];

export function ImportDialog({
  open,
  onOpenChange,
  title,
  downloadTemplate,
  preview,
  commit,
  onCommitted,
}: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState<false | "preview" | "commit">(false);
  // Explicit column mapping (expected header → CSV header). Edits mark the
  // preview stale (`mappingDirty`) until re-checked against the server.
  const [mapping, setMapping] = useState<ImportColumnMapping>({});
  const [mappingDirty, setMappingDirty] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    setBusy(false);
    setMapping({});
    setMappingDirty(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClose = (next: boolean) => {
    onOpenChange(next);
    if (!next) reset();
  };

  const handleFile = async (picked: File | undefined) => {
    if (!picked) return;
    setFile(picked);
    setResult(null);
    setMapping({});
    setMappingDirty(false);
    setBusy("preview");
    try {
      setResult(await preview(picked));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Preview failed");
      reset();
    } finally {
      setBusy(false);
    }
  };

  const handleApplyMapping = async () => {
    if (!file) return;
    setBusy("preview");
    try {
      setResult(await preview(file, mapping));
      setMappingDirty(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Preview failed");
    } finally {
      setBusy(false);
    }
  };

  const handleCommit = async () => {
    if (!file) return;
    setBusy("commit");
    try {
      const res = await commit(file, mapping);
      toast.success(
        `Imported ${res.created} · skipped ${res.skipped} · failed ${res.invalid}`,
      );
      onCommitted?.();
      handleClose(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  const hiddenErrors = result ? result.invalid - result.errors.length : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadTemplate().catch(() => toast.error("Download failed"))}
            >
              <Download className="h-4 w-4" />
              Download template
            </Button>

            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy !== false}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {file ? "Choose another file" : "Choose CSV"}
            </Button>

            {file && (
              <span className="text-sm text-muted-foreground truncate">
                {file.name}
              </span>
            )}
          </div>

          {busy === "preview" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Validating…
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-4 text-sm">
                <span>Total: <b>{result.total}</b></span>
                <span className="text-green-600">Valid: <b>{result.valid}</b></span>
                <span className="text-amber-600" title="Rows that already exist (matched an existing record) and were left unchanged — import creates, it never updates.">
                  Skipped (already exist): <b>{result.skipped}</b>
                </span>
                <span className="text-red-600">Invalid: <b>{result.invalid}</b></span>
              </div>

              {result.headerInfo && (
                <ColumnMapper
                  headerInfo={result.headerInfo}
                  mapping={mapping}
                  onChange={(next) => {
                    setMapping(next);
                    setMappingDirty(true);
                  }}
                />
              )}
              {mappingDirty && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy !== false}
                  onClick={handleApplyMapping}
                >
                  {busy === "preview" && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Apply mapping & re-check
                </Button>
              )}

              {result.warnings && result.warnings.length > 0 && (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                  <p className="mb-1 font-medium">
                    Some values will be skipped:
                  </p>
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
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => handleClose(false)} disabled={busy === "commit"}>
            Cancel
          </Button>
          <Button
            onClick={handleCommit}
            disabled={
              !result || result.valid === 0 || busy !== false || mappingDirty
            }
          >
            {busy === "commit" && <Loader2 className="h-4 w-4 animate-spin" />}
            Import {result?.valid ? `${result.valid}` : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
