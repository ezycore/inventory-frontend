// coding-standard: maintained
import type { PurchaseOrder, Sale, SaleItem } from "@/types";
import type { ReturnDetailsData } from "@/components/shared/returns";
import type {
  ReceiptSettings,
  ReceiptLogoPlacement,
  ReceiptHeaderLine,
  ReceiptMetaFields,
  ReceiptMetaKey,
  ReceiptLogoSize,
  ReceiptPaperSize,
  ReceiptWatermarkPosition,
  ReceiptWatermarkSize,
} from "@/types/receipt";
import { isPagePaper, resolveDocumentOverride, taxIdLineLabel } from "@/types/receipt";
import type {
  ReceiptDocumentKind,
  ReceiptDocumentOverrides,
  ReceiptItemColumns,
  ReceiptPaymentDetail,
  ReceiptQrSettings,
  ReceiptSignatureSettings,
  ReceiptThermalSettings,
  ReceiptTotalsOptions,
} from "@/types/receipt";
import {
  applyTotalsOptions,
  buildItemTable,
  buildPaymentDetails,
  buildQrBlock,
  buildSignature,
  buildTerms,
  paymentMethodLabel,
  pickOverridable,
  type ItemTableSpec,
  type PrintCell,
  type PrintItem,
  type TotalsExtras,
  type TotalsRow,
} from "./print-blocks";
import type { AppLocale, Translator } from "@/i18n/config";
import { formatCurrency } from "@/lib/currency";
import { formatDateOnly, formatDateTime } from "@/lib/format";
import { getOrgTimezone } from "@/hooks/use-org-calendar";
import { amountToWords } from "./number-to-words";
import { populatedRef } from "./populated-ref";
import { escapeHtml, printHtml } from "./print";
import { storefrontUrl } from "@/lib/storefront-url";

/** `t ? t(key) : fallback` — every builder below is callable without `t` (tests /
 * back-compat), falling back to the English literal that used to be hardcoded. */
const tr = (t: Translator | undefined) => (key: string, fallback: string): string =>
  t ? t(key) : fallback;

/**
 * POS document printing (invoice / receipt / purchase order) on top of the
 * shared `printHtml`. A generic doc model + renderer is fed by per-entity
 * adapters, so Sale and PurchaseOrder share one layout across four paper
 * sizes: A4 / A5 (full page) and thermal 80mm / 58mm.
 */

export type PaperSize = ReceiptPaperSize;

// Letterhead types live in types/receipt (single FE source). Aliased to the
// Print* names this module uses internally.
export type PrintLogoPlacement = ReceiptLogoPlacement;
export type PrintHeaderLine = ReceiptHeaderLine;
export type PrintMetaFields = ReceiptMetaFields;
type MetaKey = ReceiptMetaKey;

interface PrintDocColumn {
  header: string;
  align?: "left" | "right";
}

export interface PrintDoc {
  /** Which per-document overrides apply (P7). Unset → "invoice". */
  kind?: ReceiptDocumentKind;
  docTitle: string;
  number: string;
  /** `key` (when set) lets a receipt setting hide this row; keyless rows always print. */
  meta: { label: string; value: string; key?: MetaKey }[];
  /**
   * Structured item lines. When set, the renderer builds the table from the
   * org's column settings and `columns`/`rows` are ignored.
   */
  itemTable?: ItemTableSpec;
  columns: PrintDocColumn[];
  /** Pre-formatted cells (currency already applied by the adapter). */
  rows: PrintCell[][];
  totals: TotalsRow[];
  /** Optional totals rows the org's totals settings may switch on (P3). */
  totalsExtras?: TotalsExtras;
  /** Grand total spelled out (invoice "amount in words" line). Omitted when unset. */
  amountInWords?: string;
  notes?: string;
  /** Render an authorized-signature block (A4/A5 only; skipped on thermal). */
  signature?: boolean;
}

export interface DocHeader {
  orgName?: string;
  storeName?: string;
  /** Absolute logo URL (printed at the top; the print window waits for it to load). */
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  /** Free-text footer (thank-you note / return policy) printed at the bottom. */
  footer?: string;
  /** Seller tax/registration number (VAT / BIN / TIN) printed under the org name. */
  taxId?: string;
  /** Letterhead alignment; unset → per-paper default (A4/A5 left, thermal centered). */
  align?: "left" | "center" | "right";
  /** Logo placement. Unset → "top". Watermark/both render a faint centered image (A4/A5 only). */
  logoPlacement?: PrintLogoPlacement;
  /** Watermark opacity 0.03–0.20. Unset → 0.08. */
  watermarkOpacity?: number;
  /** Logo box (mm) per paper. A missing paper keeps the paper's built-in CSS size. */
  logoSize?: ReceiptLogoSize;
  /** Watermark box (% of the page). Unset → the 60 × 60 CSS default. */
  watermarkSize?: ReceiptWatermarkSize;
  /** Watermark anchor. Unset → center. */
  watermarkPosition?: ReceiptWatermarkPosition;
  /** Ordered identity lines. Empty/undefined → classic fixed order derived from the fields above. */
  headerLines?: PrintHeaderLine[];
  /** Per-document meta-row visibility. Unset → show every row the doc provides. */
  metaFields?: PrintMetaFields;
  /** Print the document title line (e.g. "Tax Invoice"). Unset → true. */
  showDocTitle?: boolean;
  /** Print the "amount in words" line. Unset → true. */
  showAmountInWords?: boolean;
  /** Caption for the amount-in-words line. Unset → "In words:". */
  amountInWordsLabel?: string;
  // print-setup-v2 P2–P8 — unset reproduces the pre-v2 output.
  itemColumns?: ReceiptItemColumns;
  totals?: ReceiptTotalsOptions;
  signature?: ReceiptSignatureSettings;
  signatureImageUrl?: string;
  stampImageUrl?: string;
  paymentDetails?: ReceiptPaymentDetail[];
  terms?: string;
  /** Resolved QR payload (storefront URL or custom value); unset → no QR. */
  qrValue?: string;
  qrLabel?: string;
  qrSizeMm?: number;
  documents?: ReceiptDocumentOverrides;
  thermal?: ReceiptThermalSettings;
  copies?: number;
  copyLabels?: string[];
}

/** Minimal org shape the print header is built from (auth-store organization). */
export interface PrintableOrg {
  name?: string;
  logo?: { url?: string; mediumUrl?: string; thumbnailUrl?: string } | null;
  address?: string;
  /** Tenant slug — resolves the "storefront" QR source. */
  slug?: string;
  /** Storefront off → the storefront QR source prints nothing. */
  features?: { storefront?: boolean } | null;
  receiptSettings?: ReceiptSettings;
}

const imageUrl = (img?: { url?: string; mediumUrl?: string; thumbnailUrl?: string } | null) =>
  img?.url ?? img?.mediumUrl ?? img?.thumbnailUrl ?? undefined;

/** The QR payload for the org's QR setting, or undefined when there is none. */
export const resolveQrValue = (
  qr: ReceiptQrSettings | undefined,
  org?: Pick<PrintableOrg, "slug" | "features">,
): string | undefined => {
  if (qr?.source === "custom") return qr.customValue?.trim() || undefined;
  if (qr?.source === "storefront" && org?.slug && org.features?.storefront !== false) {
    return storefrontUrl(org.slug);
  }
  return undefined;
};

/** Spread the v2 receipt settings onto a DocHeader (shared by the org header and the preview). */
export const receiptV2Header = (
  rs: ReceiptSettings | undefined,
  org?: Pick<PrintableOrg, "slug" | "features">,
): Partial<DocHeader> => ({
  itemColumns: rs?.itemColumns,
  totals: rs?.totals,
  signature: rs?.signature,
  signatureImageUrl: imageUrl(rs?.signatureImage),
  stampImageUrl: imageUrl(rs?.stampImage),
  paymentDetails: rs?.paymentDetails,
  terms: rs?.terms || undefined,
  qrValue: resolveQrValue(rs?.qr, org),
  qrLabel: rs?.qr?.label,
  qrSizeMm: rs?.qr?.sizeMm,
  documents: rs?.documents,
  thermal: rs?.thermal,
  copies: rs?.copies,
  copyLabels: rs?.copyLabels,
});

/** Build the letterhead header from the organization (single source for every doc). */
export const orgToPrintHeader = (
  org?: PrintableOrg,
  storeName?: string,
): DocHeader => {
  const rs = org?.receiptSettings;
  // Placement is authoritative; fall back to the legacy boolean for orgs saved
  // before the builder (showLogo false → hidden, otherwise top).
  const logoPlacement: PrintLogoPlacement =
    rs?.logoPlacement ?? (rs?.showLogo === false ? "hidden" : "top");
  return {
    orgName: org?.name,
    storeName,
    // Always resolve the URL; the placement decides whether it's rendered.
    logoUrl:
      org?.logo?.url ?? org?.logo?.mediumUrl ?? org?.logo?.thumbnailUrl ?? undefined,
    address: org?.address || undefined,
    phone: rs?.phone || undefined,
    email: rs?.email || undefined,
    taxId: rs?.taxId || undefined,
    footer: rs?.footer || undefined,
    align: rs?.headerAlign,
    logoPlacement,
    watermarkOpacity: rs?.watermarkOpacity,
    logoSize: rs?.logoSize,
    watermarkSize: rs?.watermarkSize,
    watermarkPosition: rs?.watermarkPosition,
    headerLines: rs?.headerLines,
    metaFields: rs?.metaFields,
    showDocTitle: rs?.showDocTitle,
    showAmountInWords: rs?.showAmountInWords,
    amountInWordsLabel: rs?.amountInWordsLabel,
    ...receiptV2Header(rs, org),
  };
};

/** The org's pre-selected paper size for the print menu (A4 when unset). */
export const resolveDefaultPaper = (org?: PrintableOrg): PaperSize =>
  org?.receiptSettings?.defaultPaperSize ?? "a4";

const BASE_STYLES = `
  body { font-family: -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #111827; }
  .doc { position: relative; z-index: 1; }
  .doc-title { font-weight: 700; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.02em; }
  .muted { color: #6b7280; }
  .header { margin-bottom: 4px; }
  /* Breathing room between stacked identity/meta lines so they don't jam together. */
  .header .ident > div, .header .doc-head > div { line-height: 1.5; }
  .header .org { line-height: 1.25; margin-bottom: 1px; color: #111827; }
  .meta > div { line-height: 1.6; }
  .meta b { font-weight: 600; }
  .logo { display: inline-block; object-fit: contain; margin-bottom: 6px; }
  /* Faint centered background image; fixed so it repeats behind every printed page. */
  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    max-width: 60%; max-height: 60%; object-fit: contain; z-index: 0; pointer-events: none; }
  .contact { font-size: 0.92em; }
  .footer { margin-top: 6px; text-align: center; white-space: pre-line; }
  table.items { width: 100%; border-collapse: collapse; margin-top: 4px; }
  table.items th, table.items td { text-align: left; padding: 2px 0; vertical-align: top; }
  /* Gap between columns so adjacent right-aligned numbers (Qty/Price/Refund) never touch. */
  table.items th + th, table.items td + td { padding-left: 10px; }
  .num { text-align: right; white-space: nowrap; }
  table.totals { width: 100%; margin-top: 8px; }
  table.totals td { padding: 1px 0; }
  .t-val { text-align: right; font-variant-numeric: tabular-nums; }
  .strong { font-weight: 700; }
  .strong td { color: #111827; }
  .hr { border-top: 1px dashed #9ca3af; margin: 6px 0; }
  .words { margin-top: 6px; }
  .signature { margin-top: 40px; text-align: right; }
  .signature-line { display: inline-block; border-top: 1px solid #111827; padding-top: 3px; min-width: 180px; text-align: center; color: #374151; }
`;

const PAPER_STYLES: Record<PaperSize, string> = {
  a4: `
    /* Page margin 0 so the browser can't paint its default title/URL/date
       header-footer; whitespace lives in body (left/right — repeats on every
       page) and .doc (top/bottom — repeats per document in bulk printing). */
    @page { size: A4; margin: 0; }
    body { font-size: 12px; line-height: 1.45; padding: 0 14mm; }
    .doc { max-width: 760px; margin: 0 auto; padding: 12mm 0 10mm; }
    /* Two-column head: identity left, document title right. A centered/right
       letterhead (owner's align choice) falls back to the stacked layout. */
    .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 28px; padding-bottom: 14px; }
    .header.stack { display: block; padding-bottom: 8px; }
    .doc-head { text-align: right; }
    .header.stack .doc-head { text-align: inherit; }
    .doc-title { font-size: 23px; font-weight: 800; letter-spacing: 0.03em; margin-top: 0; }
    .doc-number { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 11.5px; margin-top: 2px; }
    .org { font-size: 21px; font-weight: 800; letter-spacing: -0.01em; }
    .ident .contact { line-height: 1.65; }
    .logo { max-height: 64px; max-width: 220px; }
    /* Meta rows read in two columns (Date / Customer / …) like a form header. */
    .meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2px 40px; }
    .meta { margin-top: 10px; }
    .hr { border-top: 1px solid #e5e7eb; margin: 10px 0; }
    table.items { margin-top: 8px; }
    table.items th { text-transform: uppercase; font-size: 10px; letter-spacing: 0.06em;
      color: #6b7280; border-bottom: 2px solid #111827; padding: 8px 0 6px; }
    table.items td { border-bottom: 1px solid #f0f1f3; padding: 8px 0; }
    table.items td:first-child { font-weight: 600; }
    /* Totals as a compact right-aligned block, grand total ruled off. */
    table.totals { width: auto; min-width: 300px; margin-left: auto; margin-top: 14px; }
    table.totals td { padding: 3px 0 3px 24px; color: #4b5563; }
    table.totals td:first-child { padding-left: 0; }
    table.totals tr.strong td { border-top: 2px solid #111827; padding-top: 8px; font-size: 14px; }
    .words { text-align: right; margin-top: 10px; }
    .footer { margin-top: 10px; font-size: 11.5px; }
  `,
  // A5 portrait (148 mm): the A4 layout scaled down — same two-column head,
  // smaller type and tighter gaps so a VAT-column table still fits ~130 mm.
  // `body` prefixes beat the V2_STYLES rules appended after this block.
  a5: `
    @page { size: A5; margin: 0; }
    body { font-size: 10.5px; line-height: 1.4; padding: 0 9mm; }
    .doc { padding: 8mm 0 7mm; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding-bottom: 10px; }
    .header.stack { display: block; padding-bottom: 6px; }
    .doc-head { text-align: right; }
    .header.stack .doc-head { text-align: inherit; }
    .doc-title { font-size: 17px; font-weight: 800; letter-spacing: 0.03em; margin-top: 0; }
    .doc-number { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 10px; margin-top: 2px; }
    .org { font-size: 16px; font-weight: 800; letter-spacing: -0.01em; }
    .ident .contact { line-height: 1.55; }
    .logo { max-height: 48px; max-width: 166px; }
    .meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px 20px; }
    .meta { margin-top: 8px; }
    .hr { border-top: 1px solid #e5e7eb; margin: 8px 0; }
    table.items { margin-top: 6px; }
    table.items th { text-transform: uppercase; font-size: 9px; letter-spacing: 0.05em;
      color: #6b7280; border-bottom: 1.5px solid #111827; padding: 6px 0 4px; }
    table.items td { border-bottom: 1px solid #f0f1f3; padding: 5px 0; }
    table.items td:first-child { font-weight: 600; }
    table.items th + th, table.items td + td { padding-left: 8px; }
    table.totals { width: auto; min-width: 200px; margin-left: auto; margin-top: 10px; }
    table.totals td { padding: 2px 0 2px 16px; color: #4b5563; }
    table.totals td:first-child { padding-left: 0; }
    table.totals tr.strong td { border-top: 1.5px solid #111827; padding-top: 6px; font-size: 12px; }
    .words { text-align: right; margin-top: 8px; }
    .footer { margin-top: 8px; font-size: 10px; }
    body .signature-line { min-width: 130px; }
    body .sig-images { min-width: 130px; }
    body .sign-row { gap: 16px; margin-top: 18px; }
    body .pay-grid { gap: 4px 12px; }
  `,
  thermal80: `
    @page { size: 80mm auto; margin: 0; }
    body { font-size: 11px; width: 80mm; padding: 3mm; }
    .org { font-size: 14px; font-weight: 700; }
    .header { text-align: center; }
    .logo { max-height: 40px; max-width: 70mm; }
  `,
  thermal58: `
    @page { size: 58mm auto; margin: 0; }
    body { font-size: 10px; width: 58mm; padding: 2mm; }
    .org { font-size: 12px; font-weight: 700; }
    .header { text-align: center; }
    .logo { max-height: 32px; max-width: 50mm; }
  `,
};

/** A finite, positive mm/% value for an inline style (guards a hand-edited org doc). */
const mm = (n: number): number => (Number.isFinite(n) && n > 0 ? Math.round(n * 10) / 10 : 1);

/**
 * Inline style for the A4 watermark. Size and position add to the `.watermark`
 * CSS only when set, so the default stays the 60 % centered image.
 */
const watermarkStyle = (opacity: number, header: DocHeader): string => {
  const parts = [`opacity:${opacity}`];
  if (header.watermarkSize) {
    parts.push(
      `max-width:${mm(header.watermarkSize.widthPct)}%`,
      `max-height:${mm(header.watermarkSize.heightPct)}%`,
    );
  }
  // Top/bottom anchor 6 % in from the edge and drop the vertical centering.
  if (header.watermarkPosition === "top") {
    parts.push("top:6%", "transform:translate(-50%,0)");
  } else if (header.watermarkPosition === "bottom") {
    parts.push("top:auto", "bottom:6%", "transform:translate(-50%,0)");
  }
  return parts.join(";");
};

/** Styles for the print-setup-v2 blocks; inert when the blocks are absent. */
const V2_STYLES = `
  .item-code { font-size: 0.85em; font-weight: 400; }
  .item-note { font-size: 0.85em; font-weight: 400; }
  .signature.two { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; text-align: center; }
  .sig-block { display: flex; flex-direction: column; align-items: center; }
  .sig-images { position: relative; display: flex; align-items: flex-end; justify-content: center; min-width: 180px; }
  .sig-img { object-fit: contain; }
  .stamp-img { object-fit: contain; opacity: 0.85; margin-left: -20px; }
  .sign-row { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; margin-top: 24px; }
  .sign-row .signature { margin-top: 0; }
  .qr { text-align: center; margin-top: 8px; }
  .qr-svg { display: inline-block; }
  .qr-label { font-size: 0.85em; color: #4b5563; margin-top: 2px; }
  .pay-block { margin-top: 14px; }
  .pay-title { font-weight: 600; margin-bottom: 4px; }
  .pay-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 24px; }
  .pay-card { border: 1px solid #e5e7eb; border-radius: 4px; padding: 6px 8px; line-height: 1.5; }
  .pay-line { line-height: 1.5; }
  .terms { margin-top: 12px; font-size: 0.85em; color: #4b5563; white-space: pre-line; }
  .copy-label { text-align: right; font-size: 0.85em; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #4b5563; }
  .copy-break { page-break-after: always; break-after: page; }
  .cut-line { border-top: 1px dashed #111827; margin: 10px 0; text-align: center; font-size: 0.8em; color: #6b7280; }
`;

const FONT_SCALE = { sm: 0.9, md: 1, lg: 1.15 } as const;

/** QR size cap + unset default per paper (mm). A5 is capped below A4 to sit beside two signatures. */
const QR_SIZE_MM: Record<PaperSize, { max: number; default: number }> = {
  a4: { max: 40, default: 24 },
  a5: { max: 32, default: 20 },
  thermal80: { max: 30, default: 20 },
  thermal58: { max: 30, default: 20 },
};
const THERMAL_BASE = { thermal80: { font: 11, pad: 3 }, thermal58: { font: 10, pad: 2 } } as const;

/** Thermal font scale + side margin; nothing when unset (keeps the paper CSS). */
const thermalStyles = (paper: PaperSize, thermal?: ReceiptThermalSettings): string => {
  if (isPagePaper(paper) || !thermal) return "";
  const base = THERMAL_BASE[paper];
  const rules: string[] = [];
  if (thermal.fontScale && thermal.fontScale !== "md") {
    rules.push(`font-size: ${Math.round(base.font * FONT_SCALE[thermal.fontScale] * 10 + 1e-6) / 10}px;`);
  }
  if (thermal.sideMarginMm !== undefined && Number.isFinite(thermal.sideMarginMm)) {
    const m = Math.min(6, Math.max(0, thermal.sideMarginMm));
    rules.push(`padding-left: ${m}mm; padding-right: ${m}mm;`);
  }
  return rules.length ? `\n  body { ${rules.join(" ")} }\n` : "";
};

/** The classic fixed identity order, used when no custom `headerLines` are set. */
const LEGACY_HEADER_ORDER: PrintHeaderLine["source"][] = [
  "orgName",
  "taxId",
  "storeName",
  "address",
  "contact",
];

/** Render one identity line to HTML, or "" when it carries no content. */
const renderHeaderLine = (
  line: Pick<PrintHeaderLine, "source" | "label" | "text">,
  header: DocHeader,
  contactLine: string,
  t?: Translator,
): string => {
  switch (line.source) {
    case "orgName":
      return header.orgName
        ? `<div class="org">${escapeHtml(header.orgName)}</div>`
        : "";
    case "taxId":
      return header.taxId
        ? `<div class="muted contact">${escapeHtml(taxIdLineLabel(line.label) || tr(t)("taxRegNo", "VAT Reg. No (BIN)"))}: ${escapeHtml(header.taxId)}</div>`
        : "";
    case "storeName":
      return header.storeName
        ? `<div class="muted">${escapeHtml(header.storeName)}</div>`
        : "";
    case "address":
      return header.address
        ? `<div class="muted contact">${escapeHtml(header.address)}</div>`
        : "";
    case "contact":
      return contactLine
        ? `<div class="muted contact">${escapeHtml(contactLine)}</div>`
        : "";
    case "custom": {
      const text = line.text?.trim();
      if (!text) return "";
      const prefix = line.label ? `${escapeHtml(line.label)}: ` : "";
      return `<div class="muted contact">${prefix}${escapeHtml(text)}</div>`;
    }
    default:
      return "";
  }
};

/** Ordered identity lines: the user's visible list, or the classic fixed order. */
const resolveHeaderLines = (
  header: DocHeader,
  contactLine: string,
  t?: Translator,
): string[] => {
  const lines =
    header.headerLines && header.headerLines.length > 0
      ? header.headerLines.filter((l) => l.visible)
      : LEGACY_HEADER_ORDER.map((source) => ({ source }));
  return lines
    .map((line) => renderHeaderLine(line, header, contactLine, t))
    .filter(Boolean);
};

/**
 * Compose a generic PrintDoc into the standalone `{ body, styles, title }` a
 * print window (or an inline preview iframe) renders. Pure — no DOM side effects
 * — so the settings live-preview and the actual printout share ONE renderer and
 * can never drift. Exported for per-entity adapters that live in their own
 * modules (e.g. `utils/print-storefront-order.ts`).
 */
export const composeDocument = (
  doc: PrintDoc,
  paper: PaperSize,
  header: DocHeader,
  t?: Translator,
): { body: string; styles: string; title: string } => {
  const contactLine = [header.phone, header.email].filter(Boolean).join(" · ");
  // Explicit alignment overrides the paper default (A4 left, thermal centered).
  const alignStyle = header.align ? ` style="text-align:${header.align}"` : "";
  // Centered/right letterheads read as the classic stacked head; the default
  // (left) A4 layout puts the document title opposite the identity block.
  const stacked = header.align === "center" || header.align === "right";

  // Logo placement. Watermark is page-paper only (thermal is 1-bit: a grey wash either
  // vanishes or smears solid), so on thermal only the top-logo part of "both" runs.
  const placement = header.logoPlacement ?? "top";
  const hasLogo = !!header.logoUrl;
  const showTopLogo =
    hasLogo && (placement === "top" || placement === "both");
  const showWatermark =
    hasLogo && isPagePaper(paper) && (placement === "watermark" || placement === "both");
  const opacity = Math.min(0.2, Math.max(0.03, header.watermarkOpacity ?? 0.08));
  const watermark = showWatermark
    ? `<img class="watermark" src="${escapeHtml(header.logoUrl!)}" alt="" style="${watermarkStyle(opacity, header)}" />`
    : "";
  // A configured box overrides the paper's CSS max size inline; unset keeps the
  // class alone so orgs that never touched it print byte-identical HTML.
  const logoBox = header.logoSize?.[paper];
  const logoStyle = logoBox
    ? ` style="max-height:${mm(logoBox.heightMm)}mm;max-width:${mm(logoBox.widthMm)}mm"`
    : "";
  const topLogo = showTopLogo
    ? `<img class="logo" src="${escapeHtml(header.logoUrl!)}" alt=""${logoStyle} />`
    : "";

  // Meta rows: drop any keyed row the org switched off (keyless rows always print).
  const metaHtml = doc.meta
    .filter((m) => !m.key || header.metaFields?.[m.key] !== false)
    .map((m) => `<div>${escapeHtml(m.label)}: <b>${escapeHtml(m.value)}</b></div>`)
    .join("");

  // Document title ("Tax Invoice" etc.) is togglable; the number line always prints.
  const titleOverride = resolveDocumentOverride(doc.kind ?? "invoice", header.documents).title?.trim();
  const docTitle =
    header.showDocTitle === false
      ? ""
      : `<div class="doc-title">${escapeHtml(titleOverride || doc.docTitle)}</div>`;

  const head = `
    <div class="header${stacked ? " stack" : ""}"${alignStyle}>
      <div class="ident">
        ${topLogo}
        ${resolveHeaderLines(header, contactLine, t).join("")}
      </div>
      <div class="doc-head">
        ${docTitle}
        <div class="muted doc-number">#${escapeHtml(doc.number)}</div>
      </div>
    </div>
    <div class="meta${stacked ? "" : " meta-grid"}"${alignStyle}>
      ${metaHtml}
    </div>
  `;

  const tt = tr(t);
  const kind = doc.kind ?? "invoice";
  const override = resolveDocumentOverride(kind, header.documents);

  // Item table: structured items go through the org's column settings; legacy
  // adapters (payment receipt, statement) still hand over ready columns/rows.
  const table = doc.itemTable
    ? buildItemTable(doc.itemTable, header.itemColumns, paper, tt)
    : { columns: doc.columns, rows: doc.rows };
  const cellHtml = (cell: PrintCell) =>
    typeof cell === "object" && cell !== null ? cell.html : escapeHtml(cell);
  const thead = `<tr>${table.columns
    .map((c) => `<th class="${c.align === "right" ? "num" : ""}">${escapeHtml(c.header)}</th>`)
    .join("")}</tr>`;
  const tbody = table.rows
    .map(
      (row) =>
        `<tr>${row
          .map(
            (cell, i) =>
              `<td class="${table.columns[i]?.align === "right" ? "num" : ""}">${cellHtml(cell)}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("");

  const totalRows = applyTotalsOptions(doc.totals, doc.totalsExtras, header.totals, paper);
  const totals = `<table class="totals">${totalRows
    .map(
      (row) =>
        `<tr class="${row.strong ? "strong" : ""}"><td>${escapeHtml(row.label)}</td><td class="t-val">${escapeHtml(row.value)}</td></tr>`,
    )
    .join("")}</table>`;

  // Amount in words: gated by the org toggle (default on) with a configurable caption.
  const amountInWords =
    doc.amountInWords && header.showAmountInWords !== false
      ? `<div class="words"><span class="muted">${escapeHtml(header.amountInWordsLabel || tt("inWords", "In words:"))}</span> <b>${escapeHtml(doc.amountInWords)}</b></div>`
      : "";

  const notes = doc.notes
    ? `<div class="hr"></div><div class="muted">${escapeHtml(doc.notes)}</div>`
    : "";

  // Payment instructions (P5), unless this document type switches them off.
  const paymentDetails =
    override.showPaymentDetails === false
      ? ""
      : buildPaymentDetails(header.paymentDetails, paper, tt);

  // Signature row (P4) — full documents only (looks wrong on a thermal slip).
  // Per-document label/enable overrides win over the global signature settings.
  const signature = buildSignature(
    {
      allowed: !!doc.signature,
      enabled: override.signature?.enabled ?? header.signature?.enabled,
      leftLabel: override.signature?.leftLabel ?? header.signature?.leftLabel,
      rightLabel: override.signature?.rightLabel ?? header.signature?.rightLabel,
      imageHeightMm: header.signature?.imageHeightMm,
      signatureUrl: header.signatureImageUrl,
      stampUrl: header.stampImageUrl,
    },
    paper,
    tt,
  );

  // QR (P6): A4/A5 → bottom-left beside the signature; thermal → centered above the footer.
  const qrLimit = QR_SIZE_MM[paper];
  const qr =
    override.showQr === false
      ? ""
      : buildQrBlock(
          header.qrValue,
          header.qrLabel,
          Math.min(qrLimit.max, header.qrSizeMm ?? qrLimit.default),
        );
  const signRow =
    qr && isPagePaper(paper)
      ? `<div class="sign-row">${qr}${signature || "<div></div>"}</div>`
      : signature;
  const thermalQr = qr && !isPagePaper(paper) ? qr : "";

  const terms = buildTerms(pickOverridable(override.terms, header.terms), paper);
  const footerText = pickOverridable(override.footer, header.footer);
  const footer = footerText
    ? `<div class="hr"></div><div class="muted footer">${escapeHtml(footerText)}</div>`
    : "";

  // Watermark sits outside `.doc` (fixed, z-index 0) so it stays behind content.
  const body = `${watermark}<div class="doc">${head}<div class="hr"></div><table class="items">${thead}${tbody}</table>${totals}${amountInWords}${paymentDetails}${signRow}${notes}${terms}${thermalQr}${footer}</div>`;

  return {
    body,
    styles: BASE_STYLES + PAPER_STYLES[paper] + V2_STYLES + thermalStyles(paper, header.thermal),
    title: `${override.title?.trim() || doc.docTitle} ${doc.number}`,
  };
};

/** Render a generic PrintDoc to a print window at the chosen paper size. */
const printDoc = (
  doc: PrintDoc,
  paper: PaperSize,
  header: DocHeader,
  t?: Translator,
  locale?: AppLocale,
): boolean => {
  const { body, styles, title } = composeDocument(doc, paper, header, t);
  return printHtml(withCopies(body, paper, header, t), { title, styles, locale });
};

const DEFAULT_COPY_LABELS = [
  ["customerCopy", "Customer Copy"],
  ["shopCopy", "Shop Copy"],
  ["officeCopy", "Office Copy"],
] as const;

/**
 * Repeat a composed body for the org's copy count (P8), each stamped with its
 * copy label, separated by a page break (A4/A5) or a cut line (thermal). One copy
 * — the default — returns the body untouched.
 */
export const withCopies = (
  body: string,
  paper: PaperSize,
  header: Pick<DocHeader, "copies" | "copyLabels">,
  t?: Translator,
): string => {
  const copies = Math.min(3, Math.max(1, Math.trunc(header.copies ?? 1)));
  if (copies <= 1) return body;
  const tt = tr(t);
  return Array.from({ length: copies }, (_, i) => {
    const label =
      header.copyLabels?.[i]?.trim() ||
      tt(DEFAULT_COPY_LABELS[i][0], DEFAULT_COPY_LABELS[i][1]);
    // The fixed watermark repeats on every printed page already; a second copy
    // of the <img> would stack its opacity.
    const part = i === 0 ? body : body.replace(/^<img class="watermark"[^>]*\/>/, "");
    const stamped = part.replace(
      '<div class="doc">',
      `<div class="doc${isPagePaper(paper) && i < copies - 1 ? " copy-break" : ""}"><div class="copy-label">${escapeHtml(label)}</div>`,
    );
    return i === 0 || isPagePaper(paper) ? stamped : `<div class="cut-line">✂</div>${stamped}`;
  }).join("");
};

/** A document date on the ORGANIZATION's calendar, whatever zone the printing device is in. */
const dateStr = (value?: string | Date, locale: AppLocale = "en"): string =>
  value
    ? formatDateTime(value, locale, getOrgTimezone())
    : "";

type Currency = (n: number) => string;

/**
 * Group the sale's per-line tax snapshot into `Tax <rate>%` rows (only rates
 * that actually carried tax). Empty when no line was taxed — the caller then
 * falls back to a single "Tax" line (or nothing).
 */
const taxByRate = (
  items: SaleItem[],
  currency: Currency,
  t?: Translator,
): PrintDoc["totals"] => {
  const byRate = new Map<number, number>();
  for (const item of items) {
    const amount = item.taxAmount ?? 0;
    if (amount <= 0) continue;
    const rate = item.taxRate ?? 0;
    byRate.set(rate, (byRate.get(rate) ?? 0) + amount);
  }
  return [...byRate.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([rate, amount]) => ({
      label: t ? t("taxRate", { rate }) : `Tax ${rate}%`,
      value: currency(amount),
    }));
};

/**
 * The warranty frozen on a sale line, as one printed line — "12-month
 * replacement warranty, until 03 Oct 2027". `until` is date-only (UTC midnight),
 * so it is formatted in UTC and names the same day everywhere. Sales made before
 * warranties, or of products without one, print nothing.
 */
const warrantyNote = (item: SaleItem, t?: Translator, locale: AppLocale = "en"): string | undefined => {
  const warranty = item.warranty;
  if (!warranty) return undefined;
  const until = formatDateOnly(warranty.until, "dd MMM yyyy", locale);
  const kindFallback = { replacement: "replacement", service: "service", parts: "parts" }[warranty.kind];
  const line = t
    ? t("warrantyLine", { months: warranty.months, kind: t(`warrantyKind_${warranty.kind}`), until })
    : `${warranty.months}-month ${kindFallback} warranty, until ${until}`;
  return warranty.note ? `${line} (${warranty.note})` : line;
};

/**
 * The serial / IMEI codes recorded on a sale line — "S/N: A1B2, C3D4" — printed
 * under the warranty line so the paper names the exact units handed over.
 */
const serialNote = (item: SaleItem, t?: Translator): string | undefined => {
  const codes = item.serials?.join(", ");
  if (!codes) return undefined;
  return t ? t("serialLine", { codes }) : `S/N: ${codes}`;
};

/**
 * Every muted line under an item name, one per line. Exported for the online
 * order invoice, which prints its linked Sale's warranty and codes the same way.
 */
export const saleItemNote = (item: SaleItem, t?: Translator, locale: AppLocale = "en"): string | undefined =>
  [warrantyNote(item, t, locale), serialNote(item, t)].filter(Boolean).join("\n") || undefined;

/** One sale line as a structured print item (snapshots blank on older sales). */
const saleLineToItem = (
  item: SaleItem,
  currency: Currency,
  t?: Translator,
  locale: AppLocale = "en",
): PrintItem => ({
  name: item.comboName ? `${item.productName} (in ${item.comboName})` : item.productName,
  code: item.barcode ?? undefined,
  quantity: item.quantity,
  unit: item.unitName ?? undefined,
  price: currency(item.price),
  discount: (item.discount ?? 0) > 0 ? currency(item.discount) : undefined,
  vatRate: (item.taxAmount ?? 0) > 0 ? item.taxRate ?? undefined : undefined,
  vatAmount: (item.taxAmount ?? 0) > 0 ? currency(item.taxAmount as number) : undefined,
  amount: currency(item.subtotal),
  note: saleItemNote(item, t, locale),
});

/**
 * Totals rows a sale can offer (P3). All read the sale's own snapshots — a
 * reprint never recomputes a "current" balance (plan rule 3); a sale made
 * before the snapshots existed simply offers nothing.
 */
const saleTotalsExtras = (
  sale: Sale,
  currency: Currency,
  tt: (key: string, fallback: string) => string,
): TotalsExtras => {
  const payments = (sale.payments ?? [])
    .filter((p) => p.status !== "cancelled" && p.amount > 0)
    .map((p) => ({ label: paymentMethodLabel(p.paymentMethod, tt), value: currency(p.amount) }));
  const before = sale.customerBalanceBefore;
  const after = sale.customerBalanceAfter;
  const previousBalance =
    before != null && after != null
      ? [
          { label: tt("previousDue", "Previous due"), value: currency(before) },
          { label: tt("thisInvoiceDue", "This invoice"), value: currency(Math.max(0, after - before)) },
          { label: tt("totalDue", "Total due"), value: currency(after), strong: true },
        ]
      : undefined;
  const tendered =
    sale.tenderedAmount != null && sale.changeAmount != null
      ? [
          { label: tt("cashReceived", "Cash received"), value: currency(sale.tenderedAmount) },
          { label: tt("change", "Change"), value: currency(sale.changeAmount) },
        ]
      : undefined;
  return { payments, previousBalance, tendered };
};

const saleToDoc = (
  sale: Sale,
  currency: Currency,
  t?: Translator,
  locale: AppLocale = "en",
): PrintDoc => {
  const tt = tr(t);
  const totals: PrintDoc["totals"] = [
    { label: tt("subtotal", "Subtotal"), value: currency(sale.subtotal) },
  ];
  if (sale.additionalDiscount > 0) {
    totals.push({
      label: tt("discount", "Discount"),
      value: `- ${currency(sale.additionalDiscount)}`,
    });
  }
  // Tax by rate when the per-line snapshot is present; else a single Tax line.
  const taxRows = taxByRate(sale.items, currency, t);
  if (taxRows.length > 0) {
    totals.push(...taxRows);
  } else if (sale.taxTotal && sale.taxTotal > 0) {
    totals.push({ label: tt("tax", "Tax"), value: currency(sale.taxTotal) });
  }
  totals.push({ label: tt("total", "Total"), value: currency(sale.totalAmount), strong: true });
  totals.push({ label: tt("paid", "Paid"), value: currency(sale.paidAmount), key: "paid" });
  // The two settlements that are NOT cash-in, printed so the column reconciles.
  //
  // `dueAmount = totalAmount − paidAmount − refundCreditApplied` (sales-flow §1),
  // and until 2026-08-17 only two of those three terms reached the paper: an
  // invoice settled partly by a return credit printed `Total 55.20 · Paid 0.00 ·
  // Due 40.20` and left ৳15 unaccounted for — with a rule under "Paid", so the
  // layout actively asserted a subtraction that was false. This is the copy the
  // customer keeps and the auditor reads, and it goes wrong precisely when a
  // customer is most likely to check it: after a return.
  //
  // `refundedAmount` is cash paid back out of this sale. It does not enter the
  // due arithmetic, but on a reprint after a refund the bare "Paid" line
  // overstates what the customer is actually out of pocket, so it is shown too.
  if ((sale.refundCreditApplied ?? 0) > 0) {
    totals.push({
      label: tt("creditApplied", "Credit applied"),
      value: currency(sale.refundCreditApplied as number),
    });
  }
  if ((sale.refundedAmount ?? 0) > 0) {
    totals.push({
      label: tt("refunded", "Refunded"),
      value: `- ${currency(sale.refundedAmount as number)}`,
    });
  }
  if (sale.dueAmount > 0) {
    totals.push({ label: tt("due", "Due"), value: currency(sale.dueAmount), strong: true, key: "due" });
  }

  const hasTax =
    (sale.taxTotal ?? 0) > 0 || sale.items.some((item) => (item.taxAmount ?? 0) > 0);
  const customer = populatedRef(sale.customerId);
  // Only show a cashier line when the name is actually populated — a raw sale
  // (e.g. a POST response) carries `createdBy` as an id, which would otherwise
  // print "undefined undefined".
  const cashier = populatedRef(sale.createdBy);
  const cashierName = `${cashier?.firstName ?? ""} ${cashier?.lastName ?? ""}`.trim();

  return {
    kind: "invoice",
    // "Tax Invoice" is the accepted wording once any tax applies.
    docTitle: hasTax ? tt("taxInvoice", "Tax Invoice") : tt("invoice", "Invoice"),
    number: sale.invoiceNumber,
    meta: [
      { label: tt("date", "Date"), value: dateStr(sale.createdAt, locale) },
      {
        label: tt("customer", "Customer"),
        value: customer?.name ?? tt("walkInCustomer", "Walk-in Customer"),
        key: "customer",
      },
      ...(customer?.phone
        ? [{ label: tt("customerPhone", "Customer phone"), value: customer.phone, key: "phone" as const }]
        : []),
      ...(customer?.address
        ? [{ label: tt("address", "Address"), value: customer.address, key: "address" as const }]
        : []),
      { label: tt("status", "Status"), value: sale.status, key: "status" },
      ...(cashierName
        ? [{ label: tt("cashier", "Cashier"), value: cashierName, key: "cashier" as const }]
        : []),
    ],
    itemTable: { items: sale.items.map((item) => saleLineToItem(item, currency, t, locale)) },
    columns: [],
    rows: [],
    totals,
    totalsExtras: saleTotalsExtras(sale, currency, tt),
    amountInWords: amountToWords(sale.totalAmount, locale),
    notes: sale.notes,
    signature: true,
  };
};

const purchaseOrderToDoc = (
  order: PurchaseOrder,
  currency: Currency,
  t?: Translator,
  locale: AppLocale = "en",
): PrintDoc => {
  const tt = tr(t);
  const grand = order.invoiceAmount ?? order.totalAmount ?? order.subtotal;
  const totals: PrintDoc["totals"] = [
    { label: tt("subtotal", "Subtotal"), value: currency(order.subtotal) },
  ];
  if (order.additionalDiscount && order.additionalDiscount > 0) {
    totals.push({
      label: tt("discount", "Discount"),
      value: `- ${currency(order.additionalDiscount)}`,
    });
  }
  if (order.taxTotal > 0) {
    totals.push({ label: tt("tax", "Tax"), value: currency(order.taxTotal) });
  }
  totals.push({ label: tt("grandTotal", "Grand Total"), value: currency(grand), strong: true });
  if (order.paidAmount && order.paidAmount > 0) {
    totals.push({ label: tt("paid", "Paid"), value: currency(order.paidAmount), key: "paid" });
  }
  if (order.dueAmount && order.dueAmount > 0) {
    totals.push({ label: tt("due", "Due"), value: currency(order.dueAmount), strong: true, key: "due" });
  }

  const supplierName = populatedRef(order.supplierId)?.name ?? "-";

  return {
    kind: "purchaseOrder",
    docTitle: tt("purchaseOrder", "Purchase Order"),
    number: order.orderNumber,
    meta: [
      { label: tt("date", "Date"), value: dateStr(order.invoiceDate ?? order.createdAt, locale) },
      { label: tt("supplier", "Supplier"), value: supplierName },
      { label: tt("status", "Status"), value: order.status, key: "status" },
      ...(order.invoiceNumber
        ? [{ label: tt("invoiceNumber", "Invoice #"), value: order.invoiceNumber }]
        : []),
    ],
    itemTable: {
      items: order.items.map((item) => ({
        name: item.productName ?? "-",
        quantity: item.quantity,
        price: currency(item.price),
        vatRate: (item.taxAmount ?? 0) > 0 ? item.taxRate ?? undefined : undefined,
        vatAmount: (item.taxAmount ?? 0) > 0 ? currency(item.taxAmount as number) : undefined,
        amount: currency(item.subtotal),
      })),
    },
    columns: [],
    rows: [],
    totals,
    notes: order.notes,
  };
};

const returnToDoc = (
  data: ReturnDetailsData,
  variant: "sales" | "purchases",
  currency: Currency,
  t?: Translator,
  locale: AppLocale = "en",
): PrintDoc => {
  const tt = tr(t);
  const isSales = variant === "sales";
  const totals: PrintDoc["totals"] = [];
  if (data.deductionAmount && data.deductionAmount > 0) {
    totals.push({ label: tt("deduction", "Deduction"), value: `- ${currency(data.deductionAmount)}` });
  }
  totals.push({
    label: tt("totalRefund", "Total Refund"),
    value: currency(data.totalRefundAmount),
    strong: true,
  });
  if (data.refundedAmount !== undefined) {
    totals.push({ label: tt("refunded", "Refunded"), value: currency(data.refundedAmount) });
  }

  return {
    kind: "return",
    docTitle: isSales
      ? tt("salesReturn", "Sales Return")
      : tt("purchaseReturn", "Purchase Return"),
    number: data.returnNumber,
    meta: [
      { label: tt("date", "Date"), value: dateStr(data.date, locale) },
      {
        label: isSales
          ? tt("originalInvoice", "Original Invoice")
          : tt("originalOrder", "Original Order"),
        value: data.documentRef,
      },
      {
        label: isSales ? tt("customer", "Customer") : tt("supplier", "Supplier"),
        value: data.counterpartyName ?? "-",
        ...(isSales ? { key: "customer" as const } : {}),
      },
      { label: tt("status", "Status"), value: data.status, key: "status" },
      ...(data.reason ? [{ label: tt("reason", "Reason"), value: data.reason }] : []),
    ],
    itemTable: {
      priceHeader: isSales ? tt("price", "Price") : tt("cost", "Cost"),
      amountHeader: tt("refund", "Refund"),
      items: data.items.map((item) => ({
        name: item.comboName ? `${item.productName} (in ${item.comboName})` : item.productName,
        quantity: item.quantity,
        price: currency(isSales ? item.price ?? 0 : item.costPrice),
        amount: currency(item.refundAmount),
      })),
    },
    columns: [],
    rows: [],
    totals,
    notes: data.notes,
  };
};

interface PrintEntityOptions {
  paper: PaperSize;
  currency: Currency;
  /** Letterhead header — build via {@link orgToPrintHeader}. */
  header: DocHeader;
  /** Bound to `common.printDoc` (docs/I18N.md). Omitted → English fallback labels. */
  t?: Translator;
  /** Drives the print window's Bengali font + locale-aware dates/amount-in-words. */
  locale?: AppLocale;
}

/** Print a sale as an invoice (A4) or receipt (thermal). Returns false if printing could not start. */
export const printSaleInvoice = (sale: Sale, opts: PrintEntityOptions): boolean =>
  printDoc(
    saleToDoc(sale, opts.currency, opts.t, opts.locale),
    opts.paper,
    opts.header,
    opts.t,
    opts.locale,
  );

/** Print a purchase order. Returns false if printing could not start. */
export const printPurchaseOrder = (
  order: PurchaseOrder,
  opts: PrintEntityOptions,
): boolean =>
  printDoc(
    purchaseOrderToDoc(order, opts.currency, opts.t, opts.locale),
    opts.paper,
    opts.header,
    opts.t,
    opts.locale,
  );

/** Print a sales/purchase return (credit/debit note). Returns false if printing could not start. */
export const printReturn = (
  data: ReturnDetailsData,
  variant: "sales" | "purchases",
  opts: PrintEntityOptions,
): boolean =>
  printDoc(
    returnToDoc(data, variant, opts.currency, opts.t, opts.locale),
    opts.paper,
    opts.header,
    opts.t,
    opts.locale,
  );

/**
 * A money-receipt for one payment against a sale/purchase. Flat input — the
 * caller (sale/PO drawer) supplies the counterparty name, parent doc number and
 * running balance from its own populated context, since the raw Payment carries
 * only ids.
 */
export interface PaymentReceiptInput {
  amount: number;
  createdAt: string | Date;
  paymentMethod: string;
  accountName?: string;
  notes?: string;
  /** Parent doc the payment settles (e.g. INV-0001 / PO-0001). */
  docNumber: string;
  /** Counterparty name — "Received from" (sales) / "Paid to" (purchase). */
  counterparty: string;
  isSale: boolean;
  /** Outstanding balance after this payment, when known. */
  balanceDue?: number;
}

const paymentReceiptToDoc = (
  p: PaymentReceiptInput,
  currency: Currency,
  t?: Translator,
  locale: AppLocale = "en",
): PrintDoc => {
  const tt = tr(t);
  return {
    kind: "paymentReceipt",
    docTitle: tt("paymentReceipt", "Payment Receipt"),
    number: p.docNumber,
    meta: [
      { label: tt("date", "Date"), value: dateStr(p.createdAt, locale) },
      {
        label: p.isSale ? tt("receivedFrom", "Received from") : tt("paidTo", "Paid to"),
        value: p.counterparty,
      },
      { label: tt("method", "Method"), value: p.paymentMethod },
      ...(p.accountName ? [{ label: tt("account", "Account"), value: p.accountName }] : []),
    ],
    columns: [{ header: tt("description", "Description") }, { header: tt("amount", "Amount"), align: "right" }],
    rows: [[
      t ? t("paymentAgainst", { number: p.docNumber }) : `Payment against ${p.docNumber}`,
      currency(p.amount),
    ]],
    totals: [
      {
        label: p.isSale ? tt("amountReceived", "Amount received") : tt("amountPaid", "Amount paid"),
        value: currency(p.amount),
        strong: true,
      },
      ...(p.balanceDue != null
        ? [{ label: tt("balanceDue", "Balance due"), value: currency(p.balanceDue) }]
        : []),
    ],
    amountInWords: amountToWords(p.amount, locale),
    notes: p.notes,
    signature: true,
  };
};

/** Print a money receipt for a single payment. Returns false if printing could not start. */
export const printPaymentReceipt = (
  input: PaymentReceiptInput,
  opts: PrintEntityOptions,
): boolean =>
  printDoc(
    paymentReceiptToDoc(input, opts.currency, opts.t, opts.locale),
    opts.paper,
    opts.header,
    opts.t,
    opts.locale,
  );

/**
 * Delivery note / challan: the sale's items + quantities with NO prices or money
 * — a goods-dispatch document. Built from the same populated sale as the invoice.
 */
const saleToDeliveryDoc = (
  sale: Sale,
  t?: Translator,
  locale: AppLocale = "en",
): PrintDoc => {
  const tt = tr(t);
  const customer = populatedRef(sale.customerId);
  const totalUnits = sale.items.reduce((sum, i) => sum + (i.quantity ?? 0), 0);
  return {
    kind: "deliveryNote",
    docTitle: tt("deliveryNote", "Delivery Note"),
    number: sale.invoiceNumber,
    meta: [
      { label: tt("date", "Date"), value: dateStr(sale.createdAt, locale) },
      { label: tt("customer", "Customer"), value: customer?.name ?? tt("walkIn", "Walk-in Customer"), key: "customer" },
      ...(customer?.phone
        ? [{ label: tt("customerPhone", "Customer phone"), value: customer.phone, key: "phone" as const }]
        : []),
      ...(customer?.address
        ? [{ label: tt("address", "Address"), value: customer.address, key: "address" as const }]
        : []),
    ],
    itemTable: {
      quantityOnly: true,
      items: sale.items.map((item) => ({
        name: item.comboName ? `${item.productName} (in ${item.comboName})` : item.productName,
        code: item.barcode ?? undefined,
        quantity: item.quantity,
        unit: item.unitName ?? undefined,
      })),
    },
    columns: [],
    rows: [],
    totals: [{ label: tt("totalUnits", "Total units"), value: String(totalUnits), strong: true }],
    notes: sale.notes,
    signature: true,
  };
};

/** Print a sale as a delivery note / challan (no prices). Returns false if printing could not start. */
export const printDeliveryNote = (sale: Sale, opts: PrintEntityOptions): boolean =>
  printDoc(saleToDeliveryDoc(sale, opts.t, opts.locale), opts.paper, opts.header, opts.t, opts.locale);

/**
 * Account statement (customer or supplier): a chronological transaction list plus
 * an account-summary totals block. Generic — the caller projects its ledger to
 * `transactions`/`summary` and picks the party wording. Amounts are magnitudes;
 * the Transaction column conveys direction (no invented debit/credit signs).
 */
export interface StatementTxn {
  date: string | Date;
  type: "invoice" | "payment" | "refund" | "return" | "credit";
  reference: string;
  amount: number;
}
export interface StatementInput {
  /** e.g. "Customer Statement" / "Supplier Statement". */
  title: string;
  /** Row label for the party, e.g. "Customer" / "Supplier". */
  partyLabel: string;
  partyName: string;
  partyPhone?: string;
  transactions: StatementTxn[];
  /** Account-summary rows (raw amounts; formatted here). */
  summary: { label: string; value: number; strong?: boolean }[];
}

/** Message keys per transaction type (bound to `common.printDoc`, docs/I18N.md). */
const STATEMENT_TXN_KEY: Record<StatementTxn["type"], string> = {
  invoice: "invoice",
  payment: "txnPayment",
  refund: "txnCashRefund",
  return: "txnReturn",
  credit: "txnCreditApplied",
};
const STATEMENT_TXN_FALLBACK: Record<StatementTxn["type"], string> = {
  invoice: "Invoice",
  payment: "Payment",
  refund: "Cash refund",
  return: "Return",
  credit: "Credit applied",
};

const statementToDoc = (
  s: StatementInput,
  currency: Currency,
  t?: Translator,
  locale: AppLocale = "en",
): PrintDoc => {
  const tt = tr(t);
  return {
    kind: "statement",
    docTitle: s.title,
    number: dateStr(new Date(), locale),
    meta: [
      { label: s.partyLabel, value: s.partyName },
      ...(s.partyPhone ? [{ label: tt("phone", "Phone"), value: s.partyPhone }] : []),
    ],
    columns: [
      { header: tt("date", "Date") },
      { header: tt("transaction", "Transaction") },
      { header: tt("amount", "Amount"), align: "right" },
    ],
    rows: s.transactions.map((txn) => [
      dateStr(txn.date, locale),
      `${tt(STATEMENT_TXN_KEY[txn.type], STATEMENT_TXN_FALLBACK[txn.type])}${txn.reference ? ` ${txn.reference}` : ""}`,
      currency(txn.amount),
    ]),
    totals: s.summary.map((r) => ({
      label: r.label,
      value: currency(r.value),
      strong: r.strong,
    })),
  };
};

/** Print a customer/supplier account statement. Returns false if printing could not start. */
export const printStatement = (
  input: StatementInput,
  opts: PrintEntityOptions,
): boolean =>
  printDoc(
    statementToDoc(input, opts.currency, opts.t, opts.locale),
    opts.paper,
    opts.header,
    opts.t,
    opts.locale,
  );

/**
 * A representative invoice used to render the receipt live-preview. Mirrors the
 * real printout's tax behaviour: with tax active it reads "Tax Invoice" and shows
 * the tax line; without it, a plain "Invoice" at the pre-tax total. The sample
 * carries every snapshot (code, unit, payments, previous due, cash tendered)
 * so each v2 setting has something to show; settings left unset hide them.
 */
const buildSampleInvoiceDoc = (
  currency: Currency,
  hasTax: boolean,
  t?: Translator,
  locale: AppLocale = "en",
): PrintDoc => {
  const tt = tr(t);
  const total = hasTax ? 840 : 800;
  return {
    kind: "invoice",
    docTitle: hasTax ? tt("taxInvoice", "Tax Invoice") : tt("invoice", "Invoice"),
    number: "INV-0001",
    meta: [
      { label: tt("date", "Date"), value: dateStr(new Date(), locale) },
      { label: tt("customer", "Customer"), value: "John Doe", key: "customer" },
      { label: tt("customerPhone", "Customer phone"), value: "01700-000000", key: "phone" },
      { label: tt("status", "Status"), value: "completed", key: "status" },
    ],
    itemTable: {
      items: [
        {
          name: "Sample product A",
          code: "8901234567890",
          quantity: 2,
          unit: "pcs",
          price: currency(150),
          vatRate: hasTax ? 5 : undefined,
          vatAmount: hasTax ? currency(15) : undefined,
          amount: currency(300),
        },
        {
          name: "Sample product B",
          code: "8901234567891",
          quantity: 1,
          unit: "pcs",
          price: currency(550),
          discount: currency(50),
          vatRate: hasTax ? 5 : undefined,
          vatAmount: hasTax ? currency(25) : undefined,
          amount: currency(500),
        },
      ],
    },
    columns: [],
    rows: [],
    totals: [
      { label: tt("subtotal", "Subtotal"), value: currency(800) },
      ...(hasTax ? [{ label: t ? t("taxRate", { rate: 5 }) : "Tax 5%", value: currency(40) }] : []),
      { label: tt("total", "Total"), value: currency(total), strong: true },
      { label: tt("paid", "Paid"), value: currency(total), key: "paid" },
    ],
    totalsExtras: {
      payments: [
        { label: paymentMethodLabel("cash", tt), value: currency(total - 300) },
        { label: "bKash", value: currency(300) },
      ],
      previousBalance: [
        { label: tt("previousDue", "Previous due"), value: currency(1200) },
        { label: tt("thisInvoiceDue", "This invoice"), value: currency(0) },
        { label: tt("totalDue", "Total due"), value: currency(1200), strong: true },
      ],
      tendered: [
        { label: tt("cashReceived", "Cash received"), value: currency(1000) },
        { label: tt("change", "Change"), value: currency(1000 - (total - 300)) },
      ],
    },
    amountInWords: amountToWords(total, locale),
    signature: true,
  };
};

/** Sample of each non-invoice document, for the preview document switch (P7). */
const buildSampleDoc = (
  kind: ReceiptDocumentKind,
  currency: Currency,
  hasTax: boolean,
  t?: Translator,
  locale: AppLocale = "en",
): PrintDoc => {
  const tt = tr(t);
  const date = { label: tt("date", "Date"), value: dateStr(new Date(), locale) };
  switch (kind) {
    case "deliveryNote":
      return {
        kind,
        docTitle: tt("deliveryNote", "Delivery Note"),
        number: "INV-0001",
        meta: [date, { label: tt("customer", "Customer"), value: "John Doe", key: "customer" }],
        itemTable: {
          quantityOnly: true,
          items: [
            { name: "Sample product A", code: "8901234567890", quantity: 2, unit: "pcs" },
            { name: "Sample product B", code: "8901234567891", quantity: 1, unit: "pcs" },
          ],
        },
        columns: [],
        rows: [],
        totals: [{ label: tt("totalUnits", "Total units"), value: "3", strong: true }],
        signature: true,
      };
    case "purchaseOrder":
      return {
        kind,
        docTitle: tt("purchaseOrder", "Purchase Order"),
        number: "PO-0001",
        meta: [date, { label: tt("supplier", "Supplier"), value: "Acme Supplies" }],
        itemTable: {
          items: [
            { name: "Sample product A", quantity: 10, price: currency(100), amount: currency(1000) },
          ],
        },
        columns: [],
        rows: [],
        totals: [
          { label: tt("subtotal", "Subtotal"), value: currency(1000) },
          { label: tt("grandTotal", "Grand Total"), value: currency(1000), strong: true },
          { label: tt("paid", "Paid"), value: currency(400), key: "paid" },
          { label: tt("due", "Due"), value: currency(600), strong: true, key: "due" },
        ],
      };
    case "return":
      return {
        kind,
        docTitle: tt("salesReturn", "Sales Return"),
        number: "SR-0001",
        meta: [date, { label: tt("originalInvoice", "Original Invoice"), value: "INV-0001" }],
        itemTable: {
          priceHeader: tt("price", "Price"),
          amountHeader: tt("refund", "Refund"),
          items: [{ name: "Sample product A", quantity: 1, price: currency(150), amount: currency(150) }],
        },
        columns: [],
        rows: [],
        totals: [{ label: tt("totalRefund", "Total Refund"), value: currency(150), strong: true }],
      };
    case "paymentReceipt":
      return {
        ...paymentReceiptToDoc(
          {
            amount: 500,
            createdAt: new Date(),
            paymentMethod: "cash",
            docNumber: "INV-0001",
            counterparty: "John Doe",
            isSale: true,
            balanceDue: 300,
          },
          currency,
          t,
          locale,
        ),
      };
    case "statement":
      return statementToDoc(
        {
          title: tt("customerStatement", "Customer Statement"),
          partyLabel: tt("customer", "Customer"),
          partyName: "John Doe",
          transactions: [
            { date: new Date(), type: "invoice", reference: "INV-0001", amount: 800 },
            { date: new Date(), type: "payment", reference: "", amount: 500 },
          ],
          summary: [{ label: tt("balanceDue", "Balance due"), value: 300, strong: true }],
        },
        currency,
        t,
        locale,
      );
    default:
      return buildSampleInvoiceDoc(currency, hasTax, t, locale);
  }
};

export interface ReceiptPreviewInput {
  paper: PaperSize;
  orgName?: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  footer?: string;
  align?: "left" | "center" | "right";
  /** @deprecated legacy toggle; false → placement "hidden". Prefer `logoPlacement`. */
  showLogo?: boolean;
  logoPlacement?: PrintLogoPlacement;
  watermarkOpacity?: number;
  logoSize?: ReceiptLogoSize;
  watermarkSize?: ReceiptWatermarkSize;
  watermarkPosition?: ReceiptWatermarkPosition;
  headerLines?: PrintHeaderLine[];
  metaFields?: PrintMetaFields;
  showDocTitle?: boolean;
  showAmountInWords?: boolean;
  amountInWordsLabel?: string;
  /**
   * print-setup-v2 settings (P2–P8), as `receiptV2Header` builds them from the
   * form state. Unset → the pre-v2 sample.
   */
  v2?: Partial<DocHeader>;
  /** Which sample document to render (P7 preview switch). Unset → invoice. */
  docKind?: ReceiptDocumentKind;
  /** Render the org's copy count too (copy labels + separators). */
  showCopies?: boolean;
  /** ISO currency code for the sample amounts (falls back to a plain number). */
  currencyCode?: string;
  /** Sales tax active for the org → sample reads "Tax Invoice" + shows a tax line. */
  salesTaxActive?: boolean;
  /** Bound to `common.printDoc`. Omitted → English fallback labels. */
  t?: Translator;
  /** Drives the preview's Bengali font + locale-aware date/amount-in-words. */
  locale?: AppLocale;
}

// Reuse the app's currency formatter (symbol map, e.g. BDT → ৳) so the preview
// matches the real printout exactly — the drawers pass this same formatter.
const previewCurrency = (code?: string): Currency => (n) => formatCurrency(n, code);

/**
 * Render the receipt live-preview: the SAME composed document the printout uses,
 * over a fixed sample invoice, at the chosen paper size. Returns body + styles for
 * an inline `<iframe srcDoc>` (no print bootstrap — the preview must not auto-print).
 */
export const renderReceiptPreview = (
  input: ReceiptPreviewInput,
): { body: string; styles: string } => {
  const header: DocHeader = {
    orgName: input.orgName,
    logoUrl: input.logoUrl,
    address: input.address,
    phone: input.phone,
    email: input.email,
    taxId: input.taxId,
    footer: input.footer,
    align: input.align,
    // Placement is authoritative; derive from the legacy toggle when unset.
    logoPlacement:
      input.logoPlacement ?? (input.showLogo === false ? "hidden" : "top"),
    watermarkOpacity: input.watermarkOpacity,
    logoSize: input.logoSize,
    watermarkSize: input.watermarkSize,
    watermarkPosition: input.watermarkPosition,
    headerLines: input.headerLines,
    metaFields: input.metaFields,
    showDocTitle: input.showDocTitle,
    showAmountInWords: input.showAmountInWords,
    amountInWordsLabel: input.amountInWordsLabel,
    ...input.v2,
  };
  const { body, styles } = composeDocument(
    buildSampleDoc(
      input.docKind ?? "invoice",
      previewCurrency(input.currencyCode),
      input.salesTaxActive === true,
      input.t,
      input.locale,
    ),
    input.paper,
    header,
    input.t,
  );
  return {
    body: input.showCopies ? withCopies(body, input.paper, header, input.t) : body,
    styles,
  };
};
