"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
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

  useEffect(() => {
    if (!svgRef.current || !value) return;
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
      // invalid value for chosen symbology
    }
  }, [value, symbology, width, height, displayValue]);

  if (!value) return null;
  return <svg ref={svgRef} className={cn("inline-block", className)} />;
}
