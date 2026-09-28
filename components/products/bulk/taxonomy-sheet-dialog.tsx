"use client";
// coding-standard: maintained

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import { productsApi, useCommitTaxonomySheet } from "@/services/api";
import type { ProductTaxonomySheet } from "@/types/api";
import { getErrorMessage } from "@/lib/error-handling";
import { SheetPreview } from "./sheet-preview";

interface TaxonomySheetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The products table's current filters — the download covers the same products. */
  filters: Record<string, unknown>;
}

/**
 * Download → edit in Excel → upload → check → apply, for tags and categories.
 * Nothing is written until the merchant has seen the per-product diff and
 * pressed Apply; the server re-checks the file on apply rather than trusting
 * the preview, so an edit between the two cannot slip through unchecked.
 */
export function TaxonomySheetDialog({ open, onOpenChange, filters }: TaxonomySheetDialogProps) {
  const t = useTranslations("products.products.bulk.sheet");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ProductTaxonomySheet | null>(null);
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const commit = useCommitTaxonomySheet();

  const reset = () => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const close = (next: boolean) => {
    if (commit.isPending) return;
    onOpenChange(next);
    if (!next) reset();
  };

  const pick = async (picked: File | undefined) => {
    if (!picked) return;
    setFile(picked);
    setPreview(null);
    setChecking(true);
    try {
      setPreview(await productsApi.taxonomyPreview(picked));
    } catch (error) {
      toast.error(getErrorMessage(error));
      reset();
    } finally {
      setChecking(false);
    }
  };

  const download = async () => {
    setDownloading(true);
    try {
      await productsApi.exportTaxonomy(filters);
    } catch {
      toast.error(t("downloadFailed"));
    } finally {
      setDownloading(false);
    }
  };

  const apply = async () => {
    if (!file) return;
    try {
      const result = await commit.mutateAsync(file);
      toast.success(t("done", { count: result.updated }));
      close(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-4 text-sm">
          <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>{t("step1")}</li>
            <li>{t("step2")}</li>
            <li>{t("step3")}</li>
          </ol>
          <p className="text-xs text-muted-foreground">{t("rules")}</p>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={download} disabled={downloading}>
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {t("download")}
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => pick(event.target.files?.[0])}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={checking || commit.isPending}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {file ? t("chooseAnother") : t("choose")}
            </Button>
            {file && (
              <span className="min-w-0 max-w-full truncate text-muted-foreground">{file.name}</span>
            )}
          </div>

          {checking && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("checking")}
            </div>
          )}

          {preview && <SheetPreview result={preview} />}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} disabled={commit.isPending}>
            {t("cancel")}
          </Button>
          <Button
            onClick={apply}
            disabled={!preview || preview.changed === 0 || checking || commit.isPending}
          >
            {commit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("apply", { count: preview?.changed ?? 0 })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
