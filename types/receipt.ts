// coding-standard: maintained
/**
 * FE single source for the letterhead / print configuration (`org.receiptSettings`).
 * Mirrors the backend `ReceiptSettings`. Imported by the auth store, the org update
 * hook, the print renderer, and the receipt-settings builder so the shape can't drift.
 */

export type ReceiptPaperSize = "a4" | "thermal80" | "thermal58";
export type ReceiptHeaderAlign = "left" | "center" | "right";

/** Where the logo prints. Watermark/both are A4-only (thermal is 1-bit). */
export type ReceiptLogoPlacement = "top" | "watermark" | "both" | "hidden";

/** Source of a letterhead identity line. Non-custom sources resolve at print time. */
export type ReceiptHeaderLineSource =
  | "orgName"
  | "taxId"
  | "storeName"
  | "address"
  | "contact"
  | "custom";

export interface ReceiptHeaderLine {
  id: string;
  source: ReceiptHeaderLineSource;
  /** Optional prefix label (e.g. "Tax Reg. No"); also the caption for custom lines. */
  label?: string;
  /** Free text — only used when `source === "custom"`. */
  text?: string;
  visible: boolean;
}

/** Meta rows that can be toggled per document (Date always prints). */
export type ReceiptMetaKey = "customer" | "phone" | "status" | "cashier" | "address";
export type ReceiptMetaFields = Partial<Record<ReceiptMetaKey, boolean>>;

export interface ReceiptSettings {
  phone?: string;
  email?: string;
  taxId?: string;
  footer?: string;
  defaultPaperSize?: ReceiptPaperSize;
  headerAlign?: ReceiptHeaderAlign;
  /** @deprecated superseded by `logoPlacement`; false → placement "hidden". */
  showLogo?: boolean;
  logoPlacement?: ReceiptLogoPlacement;
  watermarkOpacity?: number;
  headerLines?: ReceiptHeaderLine[];
  metaFields?: ReceiptMetaFields;
  /** Print the document title line ("Tax Invoice" / "Purchase Order" …). Unset → true. */
  showDocTitle?: boolean;
  showAmountInWords?: boolean;
  amountInWordsLabel?: string;
}

// --- UI metadata (labels / option lists), colocated so the builder stays lean ---

export const LOGO_PLACEMENT_OPTIONS: {
  value: ReceiptLogoPlacement;
  label: string;
}[] = [
  { value: "top", label: "Top of header" },
  { value: "watermark", label: "Watermark (A4 only)" },
  { value: "both", label: "Both" },
  { value: "hidden", label: "Hidden" },
];

/** Display labels + short hints for each identity-line source, shown in the builder. */
export const HEADER_LINE_META: Record<
  ReceiptHeaderLineSource,
  { label: string; hint: string; editableLabel: boolean; custom: boolean }
> = {
  orgName: { label: "Business name", hint: "Organization profile", editableLabel: false, custom: false },
  taxId: { label: "Tax Reg. No.", hint: "From this page", editableLabel: true, custom: false },
  storeName: { label: "Store / branch", hint: "Active location", editableLabel: false, custom: false },
  address: { label: "Address", hint: "Organization profile", editableLabel: false, custom: false },
  contact: { label: "Phone · Email", hint: "From this page", editableLabel: false, custom: false },
  custom: { label: "Custom line", hint: "Your own text", editableLabel: true, custom: true },
};

export const META_FIELD_OPTIONS: { key: ReceiptMetaKey; label: string }[] = [
  { key: "customer", label: "Customer" },
  { key: "phone", label: "Customer phone" },
  { key: "status", label: "Status" },
  { key: "cashier", label: "Cashier" },
  { key: "address", label: "Customer address" },
];

export const DEFAULT_META_FIELDS: Record<ReceiptMetaKey, boolean> = {
  customer: true,
  phone: true,
  status: true,
  cashier: false,
  address: false,
};

export const DEFAULT_WATERMARK_OPACITY = 0.08;
export const DEFAULT_AMOUNT_IN_WORDS_LABEL = "In words:";

/** Fresh id for a header line (browser crypto; falls back to a random string). */
export const newLineId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `line-${Math.random().toString(36).slice(2)}`;

/**
 * Seed the ordered identity lines from the classic fixed order — used the first
 * time an org opens the builder (before any custom order was saved). Matches the
 * renderer's `LEGACY_HEADER_ORDER` so the initial builder state reflects what
 * currently prints.
 */
export const seedHeaderLines = (): ReceiptHeaderLine[] =>
  [
    { source: "orgName" as const },
    { source: "taxId" as const, label: "Tax Reg. No" },
    { source: "storeName" as const },
    { source: "address" as const },
    { source: "contact" as const },
  ].map((l) => ({ id: newLineId(), visible: true, ...l }));
