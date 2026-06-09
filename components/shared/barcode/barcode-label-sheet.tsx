"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@ui/components/dialog";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Checkbox } from "@ui/components/checkbox";
import { Printer } from "lucide-react";
import { toast } from "sonner";

export interface LabelItem {
 code: string;
 name?: string;
 price?: number;
 symbology?: "CODE128" | "EAN13" | "UPC_A" | "ITF14" | "QR";
}

interface Props {
 open: boolean;
 onOpenChange: (v: boolean) => void;
 items: LabelItem[];
 /** Optional per-label heading (e.g. organization / store name) */
 storeName?: string;
}

/** Map from our symbology enum to jsbarcode format string */
const JSBARCODE_FORMAT: Record<string, string> = {
 CODE128: "CODE128",
 EAN13: "EAN13",
 UPC_A: "UPC",
 ITF14: "ITF14",
};

/**
 * Renders a single barcode using jsbarcode (client-side, no auth needed).
 * Falls back to CODE128 if the requested format rejects the code.
 * QR codes show a text fallback (jsbarcode does not support QR).
 */
function BarcodeCell({
 code,
 symbology,
}: {
 code: string;
 symbology?: string;
}) {
 const ref = useRef<SVGSVGElement>(null);

 useEffect(() => {
  if (!ref.current || !code || symbology === "QR") return;
  const format = JSBARCODE_FORMAT[symbology ?? "CODE128"] ?? "CODE128";

  import("jsbarcode").then(({ default: JsBarcode }) => {
   try {
    JsBarcode(ref.current!, code, {
     format,
     lineColor: "#000000",
     background: "#ffffff",
      width: 1,
      height: 28,
     displayValue: true,
      fontSize: 8,
      margin: 2,
    });
   } catch {
    try {
    JsBarcode(ref.current!, code, {
     format: "CODE128",
     lineColor: "#000000",
     background: "#ffffff",
     width: 1,
     height: 28,
     displayValue: true,
     fontSize: 8,
     margin: 2,
    });
    } catch { /* nothing */ }
   }
  });
 }, [code, symbology]);

 if (symbology === "QR") {
  return (
   <div
    style={{
     margin: "4px 0",
     fontFamily: "monospace",
     fontSize: 8,
     wordBreak: "break-all",
     background: "#f5f5f5",
     padding: "4px",
     borderRadius: 4,
     width: "100%",
     textAlign: "center",
    }}
   >
    {code}
   </div>
  );
 }

 return (
  <svg
   ref={ref}
   style={{ margin: "3px 0", width: "100%", maxHeight: 40, display: "block" }}
  />
 );
}

/**
 * A single label card. Uses inline styles so innerHTML copied to the print
 * window carries all styling without requiring Tailwind in that window.
 */
function LabelCard({
 item,
 storeName,
}: {
 item: LabelItem;
 storeName?: string;
}) {
 return (
  <div
   style={{
  border: "1px dashed #bbb",
  padding: "4px 2px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    pageBreakInside: "avoid",
    breakInside: "avoid",
    overflow: "hidden",
    backgroundColor: "#ffffff",
   }}
  >
   {storeName && (
    <div
     style={{
      fontSize: 8,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      lineHeight: 1.2,
      color: "#555",
     }}
    >
     {storeName}
    </div>
   )}
  {item.name && (
   <div
    style={{
    fontSize: 8,
    fontWeight: 600,
    lineHeight: 1.2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    width: "100%",
    }}
    title={item.name}
   >
    {item.name}
   </div>
  )}
   <BarcodeCell code={item.code} symbology={item.symbology} />
  {typeof item.price === "number" && (
   <div style={{ fontSize: 9, fontWeight: 700, marginTop: 2 }}>
    {item.price.toFixed(2)}
   </div>
  )}
  </div>
 );
}

/**
 * Print-ready barcode label sheet.
 *
 * - Renders barcodes client-side via jsbarcode (no auth headers needed).
 * - Opens a dedicated print window with A4 layout for clean printing.
 * - Shows variant checkboxes when multiple items are passed so users can
 *   pick which variants to include.
 * - Max copies: 999 (6 per row).
 */
export default function BarcodeLabelSheet({
 open,
 onOpenChange,
 items,
 storeName,
}: Props) {
 const [copies, setCopies] = useState(1);
 const [selected, setSelected] = useState<Set<number>>(new Set());

 // Reset selection + copies whenever the item list changes
 useEffect(() => {
  setSelected(new Set(items.map((_, i) => i)));
  setCopies(1);
 }, [items]);

 const labels = useMemo(() => {
  const chosen = items.filter((_, i) => selected.has(i));
  const out: LabelItem[] = [];
  for (let c = 0; c < copies; c++) out.push(...chosen);
  return out;
 }, [items, copies, selected]);

 const handlePrint = () => {
  const grid = document.getElementById("bls-grid");
  if (!grid || grid.innerHTML.trim() === "" || selected.size === 0) return;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    toast.error("Please allow pop-ups to print labels.");
   return;
  }

  win.document.write(`<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Barcode Labels</title>
      <style>
        @page { margin: 8mm; size: A4; }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: #fff; }
        #print-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 1.5mm;
        }
        svg { height: 8mm; width: auto; display: block; margin: 0.8mm auto; }
      </style>
    </head>
    <body>
      <div id="print-grid">${grid.innerHTML}</div>
      <script>
        window.onload = function () {
          const images = document.images;
          let loaded = 0;
          const total = images.length;
          if (total === 0) { window.print(); return; }
          Array.from(images).forEach(function(img) {
            img.onload = img.onerror = function() {
              loaded++;
              if (loaded === total) window.print();
            };
          });
        };
        window.onafterprint = function () { window.close(); };
      <\/script>
    </body>
    </html>`);
  win.document.close();
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

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col gap-3 overflow-hidden">
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
      <Input
       id="bls-copies"
       type="number"
       min={1}
       max={999}
       value={copies}
       onChange={(e) =>
        setCopies(Math.max(1, Math.min(999, +e.target.value || 1)))
       }
       className="w-24"
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
     6 per row &bull; {selected.size} of {items.length} variant
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
      <div
       id="bls-grid"
       style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        gap: 4,
       }}
      >
       {labels.map((it, i) => (
        <LabelCard key={i} item={it} storeName={storeName} />
       ))}
      </div>
     )}
    </div>
   </DialogContent>
  </Dialog>
 );
}
