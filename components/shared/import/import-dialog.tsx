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
import { Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import type {
  ImportCall,
  ImportColumnMapping,
  ImportOptionOffer,
  ImportOptions,
  ImportResult,
} from "@/types/DataTable";
import { ColumnMapper } from "./column-mapper";
import { ImportOptionsPanel } from "./import-options";
import { ImportResultSummary } from "./import-result";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Trigger a template CSV download. */
  downloadTemplate: () => Promise<void>;
  /** Dry-run: validate the file without writing, return per-row results. */
  preview: ImportCall;
  /** Commit valid rows; returns the final result. */
  commit: ImportCall;
  /** Opt-in switches this resource offers (none by default). */
  options?: ImportOptionOffer;
  /** Called after a successful commit (e.g. refetch the list). */
  onCommitted?: () => void;
}

/** A WooCommerce export means a store is moving here, so copying its images is the default. */
const WOOCOMMERCE = "woocommerce";

export function ImportDialog({
  open,
  onOpenChange,
  title,
  downloadTemplate,
  preview,
  commit,
  options: offer = {},
  onCommitted,
}: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState<false | "preview" | "commit">(false);
  // Explicit column mapping (expected header → CSV header) and the run's
  // switches. Changing either marks the preview stale (`dirty`) until it is
  // re-checked against the server — auto-create changes what is valid.
  const [mapping, setMapping] = useState<ImportColumnMapping>({});
  const [choices, setChoices] = useState<ImportOptions>({});
  // Once the merchant has touched the image switch, the file type no longer decides it.
  const [mirrorTouched, setMirrorTouched] = useState(false);
  const [dirty, setDirty] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    setBusy(false);
    setMapping({});
    setChoices({});
    setMirrorTouched(false);
    setDirty(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClose = (next: boolean) => {
    onOpenChange(next);
    if (!next) reset();
  };

  const showResult = (next: ImportResult) => {
    setResult(next);
    if (offer.mirrorImages && !mirrorTouched) {
      setChoices((current) => ({ ...current, mirrorImages: next.dialect === WOOCOMMERCE }));
    }
  };

  const handleFile = async (picked: File | undefined) => {
    if (!picked) return;
    setFile(picked);
    setResult(null);
    setMapping({});
    setDirty(false);
    setBusy("preview");
    try {
      showResult(await preview(picked, undefined, choices));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Preview failed");
      reset();
    } finally {
      setBusy(false);
    }
  };

  const handleRecheck = async () => {
    if (!file) return;
    setBusy("preview");
    try {
      showResult(await preview(file, mapping, choices));
      setDirty(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Preview failed");
    } finally {
      setBusy(false);
    }
  };

  const handleChoice = (key: keyof ImportOptions, checked: boolean) => {
    setChoices((current) => ({ ...current, [key]: checked }));
    if (key === "mirrorImages") setMirrorTouched(true);
    // Copying images happens after the commit and changes nothing in the preview.
    if (key === "autoCreate" && result) setDirty(true);
  };

  const handleCommit = async () => {
    if (!file) return;
    setBusy("commit");
    try {
      const res = await commit(file, mapping, choices);
      toast.success(
        `Imported ${res.created} · skipped ${res.skipped} · failed ${res.invalid}`,
        choices.mirrorImages && res.created > 0
          ? { description: "Product images are being copied in the background." }
          : undefined,
      );
      onCommitted?.();
      handleClose(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {/* `sm:` prefix required — the base DialogContent ships `sm:max-w-md`,
          which outranks an unprefixed `max-w-2xl` from the sm breakpoint up. */}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* min-w-0: grid items default to a content-based minimum, so one long
            unbreakable cell would otherwise stretch the whole dialog. */}
        <div className="min-w-0 space-y-4">
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
              <span className="min-w-0 max-w-full truncate text-sm text-muted-foreground">
                {file.name}
              </span>
            )}
          </div>

          <ImportOptionsPanel
            offer={offer}
            value={choices}
            onChange={handleChoice}
            disabled={busy !== false}
          />

          {busy === "preview" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Validating…
            </div>
          )}

          {result && (
            <div className="space-y-3">
              {result.headerInfo && (
                <ColumnMapper
                  headerInfo={result.headerInfo}
                  mapping={mapping}
                  onChange={(next) => {
                    setMapping(next);
                    setDirty(true);
                  }}
                />
              )}
              {dirty && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy !== false}
                  onClick={handleRecheck}
                >
                  {busy === "preview" && <Loader2 className="h-4 w-4 animate-spin" />}
                  Apply changes & re-check
                </Button>
              )}

              <ImportResultSummary result={result} />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-wrap justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => handleClose(false)} disabled={busy === "commit"}>
            Cancel
          </Button>
          <Button
            onClick={handleCommit}
            disabled={!result || result.valid === 0 || busy !== false || dirty}
          >
            {busy === "commit" && <Loader2 className="h-4 w-4 animate-spin" />}
            Import {result?.valid ? `${result.valid}` : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
