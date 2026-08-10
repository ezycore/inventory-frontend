"use client";
// coding-standard: maintained

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@ui/components/dialog";
import { Button } from "@ui/components/button";
import type { ExportOption } from "@/types/DataTable";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

/** Default choices when a config doesn't supply its own `options`. */
export const DEFAULT_EXPORT_OPTIONS: ExportOption[] = [
  {
    key: "all",
    label: "All columns",
    description: "Full detail (tax, UOM, expiry, image, …).",
  },
  {
    key: "essential",
    label: "Essential columns",
    description: "Name, Barcode, Category, Brand, Unit, Price, Status.",
    params: { columns: "essential" },
  },
];

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Server-side count matching the current filters (an upper bound on rows). */
  total: number;
  /** Optional scope caveat shown under the options (e.g. "single products only"). */
  note?: string;
  /** Selectable export choices. Falls back to All/Essential when empty. */
  options?: ExportOption[];
  /** Runs the download with the chosen option's params merged in. */
  onExport: (params: Record<string, unknown>) => Promise<void>;
}

/**
 * Confirm-before-download dialog with a flexible choice list (guards accidental
 * clicks, sets the "large export takes a moment" expectation, and lets the user
 * pick what to export — a dataset, a column preset, or both). The download runs
 * with a spinner; the rest of the page stays interactive.
 */
export function ExportDialog({
  open,
  onOpenChange,
  total,
  note,
  options,
  onExport,
}: ExportDialogProps) {
  const choices = useMemo(
    () => (options?.length ? options : DEFAULT_EXPORT_OPTIONS),
    [options],
  );
  const [selected, setSelected] = useState(choices[0].key);
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    const choice = choices.find((c) => c.key === selected) ?? choices[0];
    setBusy(true);
    try {
      await onExport(choice.params ?? {});
      onOpenChange(false);
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      {/* `sm:` prefix required — DialogContent's own `sm:max-w-md` outranks an
          unprefixed width from the sm breakpoint up. */}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Exports up to <b>{total.toLocaleString()}</b> record(s) matching the
            current filters. A large export may take a few seconds.
          </p>

          <div className="space-y-2">
            {choices.map((choice) => (
              <button
                key={choice.key}
                type="button"
                onClick={() => setSelected(choice.key)}
                className={`w-full rounded-md border p-3 text-left text-sm transition ${
                  selected === choice.key
                    ? "border-primary ring-1 ring-primary"
                    : "border-input hover:bg-accent"
                }`}
              >
                <span className="font-medium">{choice.label}</span>
                {choice.description && (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {choice.description}
                  </span>
                )}
              </button>
            ))}
          </div>

          {note && <p className="text-xs text-muted-foreground">{note}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Export
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
