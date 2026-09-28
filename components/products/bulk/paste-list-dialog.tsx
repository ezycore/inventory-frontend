"use client";
// coding-standard: maintained

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
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
import { Textarea } from "@/ui/components/textarea";
import { useMatchProductList } from "@/services/api";
import type { ProductMatchList } from "@/types/api";
import { getErrorMessage } from "@/lib/error-handling";

/** The server's own cap on one pasted list. */
const MAX_LINES = 5000;

interface PasteListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Hand the matched product ids on — the page opens the bulk editor with them. */
  onContinue: (productIds: string[]) => void;
}

/**
 * "I have a list of 200 product names" — paste it, see which ones were found,
 * which were not and which were listed twice, then carry the found ones into
 * the bulk editor. Matching is exact (case and spacing aside) on name or
 * barcode: a near-miss is shown as not found, never guessed.
 */
export function PasteListDialog({ open, onOpenChange, onContinue }: PasteListDialogProps) {
  const t = useTranslations("products.products.bulk.list");
  const [text, setText] = useState("");
  const [result, setResult] = useState<ProductMatchList | null>(null);
  const mutation = useMatchProductList();

  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setText("");
      setResult(null);
    }
  };

  const match = async () => {
    try {
      const res = await mutation.mutateAsync(lines);
      setResult(res.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-3">
          {!result ? (
            <>
              <Textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={t("placeholder")}
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {lines.length > MAX_LINES
                  ? t("tooMany", { max: MAX_LINES })
                  : t("lineCount", { count: lines.length })}
              </p>
            </>
          ) : (
            <MatchSummary result={result} />
          )}
        </div>

        <DialogFooter>
          {result ? (
            <>
              <Button variant="outline" onClick={() => setResult(null)}>
                {t("back")}
              </Button>
              <Button
                disabled={result.matched.length === 0}
                onClick={() => {
                  onContinue(result.matched.map((row) => row.productId));
                  close(false);
                }}
              >
                {t("continue", { count: result.matched.length })}
              </Button>
            </>
          ) : (
            <Button
              onClick={match}
              disabled={lines.length === 0 || lines.length > MAX_LINES || mutation.isPending}
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("match")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MatchSummary({ result }: { result: ProductMatchList }) {
  const t = useTranslations("products.products.bulk.list");
  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span className="text-green-700 dark:text-green-400">
          {t("matched", { count: result.matched.length })}
        </span>
        {result.notFound.length > 0 && (
          <span className="text-red-600">{t("notFound", { count: result.notFound.length })}</span>
        )}
        {result.repeated.length > 0 && (
          <span className="text-amber-600">{t("repeated", { count: result.repeated.length })}</span>
        )}
      </div>
      {result.notFound.length > 0 && (
        <LineList title={t("notFoundTitle")} lines={result.notFound} />
      )}
      {result.repeated.length > 0 && (
        <LineList title={t("repeatedTitle")} lines={result.repeated} />
      )}
      <LineList title={t("matchedTitle")} lines={result.matched.map((row) => row.name)} />
    </div>
  );
}

function LineList({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <ul className="max-h-40 overflow-y-auto rounded-md border px-3 py-2 text-sm">
        {lines.map((line, index) => (
          <li key={`${line}-${index}`} className="truncate py-0.5">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
