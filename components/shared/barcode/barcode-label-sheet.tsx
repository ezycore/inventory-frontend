"use client";
// coding-standard: maintained

import { useCallback, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@ui/components/dialog";
import { Button } from "@ui/components/button";
import { NumberField } from "@ui/components/number-field";
import { Label } from "@ui/components/label";
import { Checkbox } from "@ui/components/checkbox";
import { SimpleSelect } from "@ui/components/simple-select";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { printHtml } from "@/utils/print";
import { LabelCard, type LabelItem } from "./barcode-label-card";
import {
  DEFAULT_LABEL_PRESET_ID,
  LABEL_PRESETS,
  findLabelPreset,
  labelCardStyle,
  labelGridStyle,
  labelPrintStyles,
  type LabelPresetId,
} from "./label-presets";

export type { LabelItem };

/** Remembers the stock the merchant actually loads, so it survives a reload. */
const PRESET_STORAGE_KEY = "barcode-label-preset";

const readStoredPresetId = (): LabelPresetId => {
  if (typeof window === "undefined") return DEFAULT_LABEL_PRESET_ID;
  try {
    return findLabelPreset(localStorage.getItem(PRESET_STORAGE_KEY)).id;
  } catch {
    // localStorage may be unavailable (privacy mode, blocked storage).
    return DEFAULT_LABEL_PRESET_ID;
  }
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: LabelItem[];
  /** Optional per-label heading (e.g. organization / store name) */
  storeName?: string;
}

/**
 * Print-ready barcode label sheet.
 *
 * - Renders barcodes client-side via jsbarcode (no auth headers needed).
 * - Prints onto a chosen label stock (A4 sheet grids or thermal rolls) — see
 *   `label-presets.ts`; the preview is laid out from the same preset, so it
 *   shows the real size.
 * - Shows variant checkboxes when multiple items are passed so users can
 *   pick which variants to include.
 * - Max copies: 999.
 */
export default function BarcodeLabelSheet({
  open,
  onOpenChange,
  items,
  storeName,
}: Props) {
  const [copies, setCopies] = useState(1);
  // Read synchronously on first render so the preview never flashes the wrong
  // stock; the dialog is client-only, so there is no hydration mismatch to fear.
  const [presetId, setPresetId] = useState<LabelPresetId>(readStoredPresetId);
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(items.map((_, i) => i)),
  );

  // Reset selection + copies whenever the item list changes (render-phase reset
  // instead of an effect to avoid a redundant re-render).
  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setSelected(new Set(items.map((_, i) => i)));
    setCopies(1);
  }

  const preset = findLabelPreset(presetId);

  const choosePreset = useCallback((value: string) => {
    const next = findLabelPreset(value);
    setPresetId(next.id);
    try {
      localStorage.setItem(PRESET_STORAGE_KEY, next.id);
    } catch {
      // ignore — the choice still applies for this session
    }
  }, []);

  const labels = useMemo(() => {
    const chosen = items.filter((_, i) => selected.has(i));
    const out: LabelItem[] = [];
    for (let c = 0; c < copies; c++) out.push(...chosen);
    return out;
  }, [items, copies, selected]);

  const handlePrint = () => {
    const grid = document.getElementById("bls-grid");
    if (!grid || grid.innerHTML.trim() === "" || selected.size === 0) return;

    // Prints via the shared path (utils/print.ts): hidden iframe on desktop, the
    // top-level document behind @media print on mobile.
    const opened = printHtml(`<div id="print-grid">${grid.innerHTML}</div>`, {
      title: "Barcode Labels",
      styles: labelPrintStyles(preset),
    });
    if (!opened) toast.error("Couldn't start printing. Please try again.");
  };

  const allSelected = items.length > 0 && selected.size === items.length;

  const toggleAll = () =>
    allSelected
      ? setSelected(new Set())
      : setSelected(new Set(items.map((_, i) => i)));

  const toggleOne = (idx: number, checked: boolean) => {
    const s = new Set(selected);
    if (checked) s.add(idx);
    else s.delete(idx);
    setSelected(s);
  };

  const isRoll = preset.sheet.kind === "roll";
  const layoutHint =
    preset.sheet.kind === "roll"
      ? "1 per label"
      : `${preset.sheet.columns} per row`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col gap-3 overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            Print Barcode Labels &mdash; {labels.length} label
            {labels.length !== 1 ? "s" : ""}
          </DialogTitle>
        </DialogHeader>

        {/* ── Controls ── */}
        <div className="flex items-end gap-4 flex-wrap flex-shrink-0">
          <div className="space-y-1">
            <Label htmlFor="bls-copies">Copies per item</Label>
            <NumberField
              id="bls-copies"
              precision={0}
              min={1}
              max={999}
              value={copies}
              onChange={(v) => setCopies(Math.max(1, Math.min(999, v ?? 1)))}
              className="w-24"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bls-preset">Label size</Label>
            <SimpleSelect
              id="bls-preset"
              value={preset.id}
              onValueChange={choosePreset}
              options={LABEL_PRESETS.map((p) => ({
                value: p.id,
                label: p.label,
              }))}
              className="w-64"
            />
          </div>
          <Button
            onClick={handlePrint}
            disabled={selected.size === 0}
            className="gap-2"
          >
            <Printer className="h-4 w-4" /> Print
          </Button>
          <p className="text-xs text-muted-foreground self-end pb-0.5">
            {layoutHint} &bull; {selected.size} of {items.length} variant
            {items.length !== 1 ? "s" : ""} selected
          </p>
        </div>

        {/* ── Variant selector (only when multiple items) ── */}
        {items.length > 1 && (
          <div className="flex-shrink-0 border rounded-md p-2.5 bg-muted/30 space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="bls-all"
                checked={allSelected}
                onCheckedChange={() => toggleAll()}
              />
              <Label
                htmlFor="bls-all"
                className="text-xs font-medium cursor-pointer"
              >
                Select all variants
              </Label>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 pl-1">
              {items.map((item, idx) => (
                <label
                  key={idx}
                  className="flex items-center gap-1.5 text-xs cursor-pointer"
                >
                  <Checkbox
                    checked={selected.has(idx)}
                    onCheckedChange={(c) => toggleOne(idx, !!c)}
                  />
                  <span
                    className="max-w-[180px] truncate"
                    title={item.name || item.code}
                  >
                    {item.name || item.code}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ── Preview grid ── */}
        <div className="flex-1 min-h-0 overflow-auto rounded border bg-white text-black p-2">
          {labels.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-sm text-gray-400">
              Select at least one variant above.
            </div>
          ) : (
            <div id="bls-grid" style={labelGridStyle(preset)}>
              {labels.map((it, i) => (
                <LabelCard
                  key={i}
                  item={it}
                  cardStyle={labelCardStyle(preset)}
                  previewOutline={isRoll}
                  storeName={storeName}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
