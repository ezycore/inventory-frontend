"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { checkBarcodeForSymbology } from "@/utils/barcode-symbology";
import { cn } from "@ui/lib/utils";

export type BarcodeSymbology =
  | "CODE128"
  | "EAN13"
  | "UPC_A"
  | "ITF14"
  | "QR";

const TO_JSBARCODE: Partial<Record<BarcodeSymbology, string>> = {
  CODE128: "CODE128",
  EAN13: "EAN13",
  UPC_A: "UPC",
  ITF14: "ITF14",
};

/**
 * Client-side barcode preview using jsbarcode (SVG).
 * Use this for live preview while editing forms. For print sheets prefer the
 * server-rendered PNG via `barcodeApi.imageUrl(...)` for consistent print quality.
 *
 * QR codes aren't supported by jsbarcode — for QR we fall back to the server PNG.
 */
export interface BarcodeImageProps {
  value: string;
  symbology?: BarcodeSymbology;
  width?: number;
  height?: number;
  displayValue?: boolean;
  className?: string;
}

export function BarcodeImage({
  value,
  symbology = "CODE128",
  width = 2,
  height = 60,
  displayValue = true,
  className,
}: BarcodeImageProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  // Checked before rendering rather than caught after. The `catch {}` this
  // replaces left an EMPTY <svg> on screen: a merchant who picked UPC-A for an
  // alphanumeric barcode saw a blank space, no reason, and only found out at
  // print time. Say which rule was broken, where they can still fix it.
  const check = checkBarcodeForSymbology(value, symbology);

  useEffect(() => {
    if (!svgRef.current || !value || !check.ok) return;
    const format = TO_JSBARCODE[symbology];
    if (!format) {
      // QR or unsupported — caller should use BE image URL
      return;
    }
    try {
      JsBarcode(svgRef.current, value, {
        format,
        width,
        height,
        displayValue,
        margin: 4,
      });
    } catch {
      // A wrong check digit on an otherwise well-formed code — the one case the
      // pre-check cannot know. The message below still explains the blank.
    }
  }, [value, symbology, width, height, displayValue, check.ok]);

  if (!value) return null;
  if (!check.ok) {
    return (
      <p className={cn("text-xs text-destructive", className)} role="status">
        {check.reason}
      </p>
    );
  }
  return <svg ref={svgRef} className={cn("inline-block", className)} />;
}
