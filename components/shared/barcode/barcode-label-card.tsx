"use client";
// coding-standard: maintained

import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@ui/lib/utils";
import type { LabelPreset } from "./label-presets";

export interface LabelItem {
  code: string;
  name?: string;
  price?: number;
  symbology?: "CODE128" | "EAN13" | "UPC_A" | "ITF14" | "QR";
}

/** Map from our symbology enum to jsbarcode's format string. */
const JSBARCODE_FORMAT: Record<string, string> = {
  CODE128: "CODE128",
  EAN13: "EAN13",
  UPC_A: "UPC",
  ITF14: "ITF14",
};

/** jsbarcode geometry — the printed bar height comes from the preset's CSS,
 *  so these values only set the aspect the SVG is drawn at. */
const BARCODE_OPTIONS = {
  lineColor: "#000000",
  background: "#ffffff",
  width: 1,
  height: 28,
  displayValue: true,
  fontSize: 8,
  margin: 2,
} as const;

/**
 * Renders a single barcode using jsbarcode (client-side, no auth needed).
 * Falls back to CODE128 if the requested format rejects the code.
 * QR codes show a text fallback (jsbarcode does not support QR).
 */
function BarcodeCell({ code, symbology }: { code: string; symbology?: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || !code || symbology === "QR") return;
    const format = JSBARCODE_FORMAT[symbology ?? "CODE128"] ?? "CODE128";

    void import("jsbarcode").then(({ default: JsBarcode }) => {
      try {
        JsBarcode(ref.current!, code, { ...BARCODE_OPTIONS, format });
      } catch {
        try {
          JsBarcode(ref.current!, code, {
            ...BARCODE_OPTIONS,
            format: "CODE128",
          });
        } catch {
          /* nothing */
        }
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

interface LabelCardProps {
  item: LabelItem;
  /** Sizing + cut guides for the chosen label stock. */
  cardStyle: CSSProperties;
  /** Roll stock is die-cut, so its edge is only drawn in the preview. */
  previewOutline: boolean;
  /** Optional per-label heading (e.g. organization / store name). */
  storeName?: string;
}

/**
 * A single label card.
 *
 * Sizing and anything that must PRINT is inline, because the print window
 * receives this markup with no stylesheet but `labelPrintStyles`. The Tailwind
 * class is therefore preview-only by construction — it reaches the print
 * document as a class name that matches nothing.
 */
export function LabelCard({
  item,
  cardStyle,
  previewOutline,
  storeName,
}: LabelCardProps) {
  return (
    <div
      className={cn(previewOutline && "outline outline-1 outline-gray-300")}
      style={{
        padding: "4px 2px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        pageBreakInside: "avoid",
        breakInside: "avoid",
        overflow: "hidden",
        backgroundColor: "#ffffff",
        ...cardStyle,
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
