// coding-standard: maintained
/**
 * Label-stock presets for the barcode label sheet.
 *
 * A barcode label is printed on physical stock, so a preset is defined by the
 * millimetre size of ONE label plus how that label tiles a page:
 *
 * - **A4 sheet** — many labels tile a portrait A4 page in a grid, with dashed
 *   cut guides printed so the sheet can be cut by hand.
 * - **Continuous** — the 58/80 mm thermal RECEIPT printer the merchant already
 *   owns for invoices. `size: <w>mm auto`, so labels run down the roll; still
 *   cut by hand, so still cut guides.
 * - **Roll** — die-cut label stock on a dedicated label printer: exactly one
 *   label per page, no cut guides (the edge is the die cut).
 *
 * Continuous and roll are NOT interchangeable even at a similar width: a
 * continuous page is `auto`-height and a die-cut page is a fixed rectangle the
 * printer must actually be loaded with.
 *
 * The same preset drives the on-screen preview and the print stylesheet, so
 * what the dialog shows is the size that comes out of the printer.
 *
 * Mobile note: `printHtml` strips a NAMED `@page size` (A4) so the paper picked
 * in the print dialog wins, but keeps a physical one (`80mm auto`,
 * `50mm 25mm`). Both roll kinds survive the mobile path intact — see
 * `utils/print.ts`.
 */

import type { CSSProperties } from "react";

export type LabelPresetId =
  | "a4-6"
  | "a4-4"
  | "receipt80"
  | "receipt58"
  | "roll-50x25"
  | "roll-38x25"
  | "roll-40x30";

export interface LabelPreset {
  id: LabelPresetId;
  label: string;
  /** One label's printed size in mm. */
  widthMm: number;
  heightMm: number;
  /** Bar height inside the label — everything else on the card is text. */
  barcodeHeightMm: number;
  sheet:
    | { kind: "a4"; columns: number; gapMm: number }
    | {
        kind: "continuous";
        rollWidthMm: number;
        columns: number;
        gapMm: number;
        padMm: number;
      }
    | { kind: "roll" };
}

/** Portrait A4 and the frame the print body puts around the grid. */
const A4_WIDTH_MM = 210;
const A4_PADDING_MM = 8;

/** Width of one cell once the page padding and the inter-label gaps come out. */
const cellWidthMm = (
  paperWidthMm: number,
  padMm: number,
  columns: number,
  gapMm: number,
): number =>
  (paperWidthMm - padMm * 2 - gapMm * (columns - 1)) / columns;

const a4Preset = (
  id: LabelPresetId,
  columns: number,
  gapMm: number,
  heightMm: number,
  barcodeHeightMm: number,
): LabelPreset => ({
  id,
  label: `A4 sheet · ${columns} per row`,
  widthMm: cellWidthMm(A4_WIDTH_MM, A4_PADDING_MM, columns, gapMm),
  heightMm,
  barcodeHeightMm,
  sheet: { kind: "a4", columns, gapMm },
});

/**
 * A 58/80 mm thermal RECEIPT printer — the one most merchants already own for
 * invoices. Continuous paper, so labels flow down the roll and are cut by hand;
 * this is not die-cut stock and gets the same dashed cut guides as A4.
 */
const receiptPreset = (
  id: LabelPresetId,
  rollWidthMm: number,
  columns: number,
  gapMm: number,
  padMm: number,
  heightMm: number,
  barcodeHeightMm: number,
): LabelPreset => ({
  id,
  label: `Receipt roll ${rollWidthMm} mm · ${columns} per row`,
  widthMm: cellWidthMm(rollWidthMm, padMm, columns, gapMm),
  heightMm,
  barcodeHeightMm,
  sheet: { kind: "continuous", rollWidthMm, columns, gapMm, padMm },
});

const rollPreset = (
  id: LabelPresetId,
  widthMm: number,
  heightMm: number,
  barcodeHeightMm: number,
): LabelPreset => ({
  id,
  label: `Label roll ${widthMm} × ${heightMm} mm`,
  widthMm,
  heightMm,
  barcodeHeightMm,
  sheet: { kind: "roll" },
});

export const LABEL_PRESETS: LabelPreset[] = [
  a4Preset("a4-6", 6, 1.5, 22, 8),
  a4Preset("a4-4", 4, 2, 28, 11),
  receiptPreset("receipt80", 80, 2, 1, 3, 22, 8),
  receiptPreset("receipt58", 58, 1, 0, 2, 24, 9),
  rollPreset("roll-50x25", 50, 25, 9),
  rollPreset("roll-38x25", 38, 25, 8),
  rollPreset("roll-40x30", 40, 30, 10),
];

export const DEFAULT_LABEL_PRESET_ID: LabelPresetId = "a4-6";

/** Resolve an id (possibly a stale one from storage) to a real preset. */
export const findLabelPreset = (id: string | null | undefined): LabelPreset =>
  LABEL_PRESETS.find((preset) => preset.id === id) ?? LABEL_PRESETS[0];

/**
 * The print document's stylesheet. Only inline styles and this survive into the
 * print window — the app's classes reach it as dead attributes — so anything
 * that must print has to be expressed here or inline on the card.
 */
export const labelPrintStyles = (preset: LabelPreset): string => {
  const bars = `svg { height: ${preset.barcodeHeightMm}mm; width: auto; display: block; margin: 0.8mm auto; }`;

  if (preset.sheet.kind === "roll") {
    // One label per page: the page IS the label, so no body padding and an
    // explicit break after every card but the last (a trailing `always` would
    // eject a blank label).
    return `
  @page { margin: 0; size: ${preset.widthMm}mm ${preset.heightMm}mm; }
  body { font-family: Arial, sans-serif; padding: 0; }
  #print-grid > *:not(:last-child) { break-after: page; page-break-after: always; }
  ${bars}
`;
  }

  const grid = (columns: number, gapMm: number) =>
    `#print-grid { display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: ${gapMm}mm; }`;

  if (preset.sheet.kind === "continuous") {
    // Continuous paper: `auto` height lets the roll run as long as the labels
    // need, exactly as the thermal invoice does (utils/print-documents.ts).
    const { rollWidthMm, columns, gapMm, padMm } = preset.sheet;
    return `
  @page { margin: 0; size: ${rollWidthMm}mm auto; }
  body { font-family: Arial, sans-serif; width: ${rollWidthMm}mm; padding: ${padMm}mm; }
  ${grid(columns, gapMm)}
  ${bars}
`;
  }

  const { columns, gapMm } = preset.sheet;
  return `
  @page { margin: 0; size: A4; }
  body { font-family: Arial, sans-serif; padding: ${A4_PADDING_MM}mm; }
  ${grid(columns, gapMm)}
  ${bars}
`;
};

/** Preview container — mirrors the print grid so the preview is not a lie. */
export const labelGridStyle = (preset: LabelPreset): CSSProperties => {
  const { sheet } = preset;
  if (sheet.kind === "roll")
    return { display: "flex", flexWrap: "wrap", gap: "2mm" };

  const grid: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${sheet.columns}, 1fr)`,
    gap: `${sheet.gapMm}mm`,
  };
  // A receipt roll is narrow (58/80 mm). Letting the preview fill the dialog
  // would show a label three times the width that comes out of the printer.
  return sheet.kind === "continuous"
    ? { ...grid, width: `${sheet.rollWidthMm}mm`, maxWidth: "100%" }
    : grid;
};

/**
 * Per-card style. Inline because the print window copies the cards' markup and
 * has no stylesheet of its own beyond `labelPrintStyles`.
 *
 * A4 and receipt-roll cells take their width from the grid track and only need
 * a floor on the height; a die-cut label is pinned to the exact stock size.
 */
export const labelCardStyle = (preset: LabelPreset): CSSProperties =>
  preset.sheet.kind === "roll"
    ? {
        width: `${preset.widthMm}mm`,
        height: `${preset.heightMm}mm`,
        justifyContent: "center",
      }
    : {
        minHeight: `${preset.heightMm}mm`,
        // Dashed cut guides — A4 and receipt paper are cut by hand; die-cut
        // label stock already has its edge and must print none.
        border: "1px dashed #bbb",
      };
