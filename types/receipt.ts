// coding-standard: maintained
/**
 * FE single source for the letterhead / print configuration (`org.receiptSettings`).
 * Mirrors the backend `ReceiptSettings`. Imported by the auth store, the org update
 * hook, the print renderer, and the receipt-settings builder so the shape can't drift.
 */
import type { Translator } from "@/i18n/config";
import { newLocalId } from "@/utils/local-id";

export type ReceiptPaperSize = "a4" | "thermal80" | "thermal58";
export type ReceiptHeaderAlign = "left" | "center" | "right";

/** Where the logo prints. Watermark/both are A4-only (thermal is 1-bit). */
export type ReceiptLogoPlacement = "top" | "watermark" | "both" | "hidden";

/** Vertical anchor of the A4 watermark. */
export type ReceiptWatermarkPosition = "center" | "top" | "bottom";

/** Logo bounding box (mm) for one paper. `object-fit: contain` keeps the ratio. */
export interface ReceiptLogoBox {
  heightMm: number;
  widthMm: number;
}

export type ReceiptLogoSize = Partial<Record<ReceiptPaperSize, ReceiptLogoBox>>;

export interface ReceiptWatermarkSize {
  widthPct: number;
  heightPct: number;
}

export type ReceiptLineVatMode = "off" | "rate" | "amount" | "both";

/** Optional item-table columns (print-setup-v2 P2). */
export interface ReceiptItemColumns {
  serial?: boolean;
  unit?: boolean;
  code?: boolean;
  discount?: boolean;
  /** Unset → "rate" on A4 when VAT is active, else "off". */
  vat?: ReceiptLineVatMode;
}

/** Totals-block extras (P3). */
export interface ReceiptTotalsOptions {
  /** Default true. */
  showDue?: boolean;
  showPaymentMethods?: boolean;
  showPreviousBalance?: boolean;
  /** Unset → on for thermal, off for A4. */
  showTenderedChange?: boolean;
}

/** Signature block (P4). */
export interface ReceiptSignatureSettings {
  enabled?: boolean;
  leftLabel?: string;
  rightLabel?: string;
  imageHeightMm?: number;
}

export interface ReceiptImage {
  url?: string;
  mediumUrl?: string;
  thumbnailUrl?: string;
  publicId?: string;
}

export type ReceiptWalletProvider = "bkash" | "nagad" | "rocket" | "upay" | "other";
export type ReceiptWalletAccountType = "personal" | "merchant" | "agent";

/** Printed payment instruction (P5) — text only, never linked to accounts. */
export interface ReceiptPaymentDetail {
  id: string;
  kind: "bank" | "wallet";
  visible: boolean;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  branch?: string;
  routingNumber?: string;
  provider?: ReceiptWalletProvider;
  number?: string;
  accountType?: ReceiptWalletAccountType;
  label?: string;
}

export type ReceiptQrSource = "off" | "storefront" | "custom";
export interface ReceiptQrSettings {
  source?: ReceiptQrSource;
  customValue?: string;
  label?: string;
  sizeMm?: number;
}

export type ReceiptDocumentKind =
  | "invoice"
  | "deliveryNote"
  | "purchaseOrder"
  | "return"
  | "paymentReceipt"
  | "statement";

export const RECEIPT_DOCUMENT_KINDS: ReceiptDocumentKind[] = [
  "invoice",
  "deliveryNote",
  "purchaseOrder",
  "return",
  "paymentReceipt",
  "statement",
];

/** Per-document override (P7). Unset inherits; `null` footer/terms = none on this doc. */
export interface ReceiptDocumentOverride {
  title?: string;
  footer?: string | null;
  terms?: string | null;
  showPaymentDetails?: boolean;
  showQr?: boolean;
  signature?: { enabled?: boolean; leftLabel?: string; rightLabel?: string };
}

export type ReceiptDocumentOverrides = Partial<Record<ReceiptDocumentKind, ReceiptDocumentOverride>>;

export type ReceiptFontScale = "sm" | "md" | "lg";
export interface ReceiptThermalSettings {
  fontScale?: ReceiptFontScale;
  sideMarginMm?: number;
}

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
  /** Optional prefix label (e.g. "VAT Reg. No (BIN)"); also the caption for custom lines. */
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
  /** Logo box per paper. A missing paper prints `DEFAULT_LOGO_SIZE`. */
  logoSize?: ReceiptLogoSize;
  /** Watermark box (% of the page). Unset → 60 × 60. */
  watermarkSize?: ReceiptWatermarkSize;
  /** Unset → center. */
  watermarkPosition?: ReceiptWatermarkPosition;
  headerLines?: ReceiptHeaderLine[];
  metaFields?: ReceiptMetaFields;
  /** Print the document title line ("Tax Invoice" / "Purchase Order" …). Unset → true. */
  showDocTitle?: boolean;
  showAmountInWords?: boolean;
  amountInWordsLabel?: string;
  itemColumns?: ReceiptItemColumns;
  totals?: ReceiptTotalsOptions;
  signature?: ReceiptSignatureSettings;
  /** Uploaded via `PUT /organization/receipt-images`; read-only in the settings payload. */
  signatureImage?: ReceiptImage | null;
  stampImage?: ReceiptImage | null;
  paymentDetails?: ReceiptPaymentDetail[];
  terms?: string;
  qr?: ReceiptQrSettings;
  documents?: ReceiptDocumentOverrides;
  thermal?: ReceiptThermalSettings;
  copies?: number;
  copyLabels?: string[];
  autoPrintAfterSale?: boolean;
}

// --- UI metadata (labels / option lists), colocated so the builder stays lean ---
// `t` is bound to the `settings.receipt` namespace by the caller.

export const getLogoPlacementOptions = (
  t: Translator,
): { value: ReceiptLogoPlacement; label: string }[] => [
  { value: "top", label: t("logoPlacementOptions.top") },
  { value: "watermark", label: t("logoPlacementOptions.watermark") },
  { value: "both", label: t("logoPlacementOptions.both") },
  { value: "hidden", label: t("logoPlacementOptions.hidden") },
];

/** Display labels + short hints for each identity-line source, shown in the builder. */
export const getHeaderLineMeta = (
  t: Translator,
): Record<
  ReceiptHeaderLineSource,
  { label: string; hint: string; editableLabel: boolean; custom: boolean }
> => ({
  orgName: { label: t("headerLineMeta.orgName.label"), hint: t("headerLineMeta.orgName.hint"), editableLabel: false, custom: false },
  taxId: { label: t("headerLineMeta.taxId.label"), hint: t("headerLineMeta.taxId.hint"), editableLabel: true, custom: false },
  storeName: { label: t("headerLineMeta.storeName.label"), hint: t("headerLineMeta.storeName.hint"), editableLabel: false, custom: false },
  address: { label: t("headerLineMeta.address.label"), hint: t("headerLineMeta.address.hint"), editableLabel: false, custom: false },
  contact: { label: t("headerLineMeta.contact.label"), hint: t("headerLineMeta.contact.hint"), editableLabel: false, custom: false },
  custom: { label: t("headerLineMeta.custom.label"), hint: t("headerLineMeta.custom.hint"), editableLabel: true, custom: true },
});

export const getMetaFieldOptions = (
  t: Translator,
): { key: ReceiptMetaKey; label: string }[] => [
  { key: "customer", label: t("metaFieldOptions.customer") },
  { key: "phone", label: t("metaFieldOptions.phone") },
  { key: "status", label: t("metaFieldOptions.status") },
  { key: "cashier", label: t("metaFieldOptions.cashier") },
  { key: "address", label: t("metaFieldOptions.address") },
];

export const DEFAULT_META_FIELDS: Record<ReceiptMetaKey, boolean> = {
  customer: true,
  phone: true,
  status: true,
  cashier: false,
  address: false,
};

export const DEFAULT_WATERMARK_OPACITY = 0.08;

/**
 * The renderer's built-in logo box per paper, in mm (the old fixed CSS:
 * A4 64 × 220 px, 80 mm 40 px × 70 mm, 58 mm 32 px × 50 mm). Shown as the
 * starting value in the builder; an org that never edits a paper's size keeps
 * the original CSS, not this mm conversion.
 */
export const DEFAULT_LOGO_SIZE: Record<ReceiptPaperSize, ReceiptLogoBox> = {
  a4: { heightMm: 17, widthMm: 58 },
  thermal80: { heightMm: 10.5, widthMm: 70 },
  thermal58: { heightMm: 8.5, widthMm: 50 },
};

/** Mirrors the backend clamps (`RECEIPT_LOGO_SIZE_LIMITS`). */
export const LOGO_SIZE_LIMITS: Record<
  ReceiptPaperSize,
  { height: [number, number]; width: [number, number] }
> = {
  a4: { height: [8, 40], width: [15, 120] },
  thermal80: { height: [5, 30], width: [10, 72] },
  thermal58: { height: [5, 25], width: [10, 50] },
};

/**
 * Built-in per-document overrides (plan P7): shipped as defaults, editable.
 * Only NEW blocks get a built-in default — anything that would change what a
 * document prints today stays opt-in (plan rule 2): the PO footer still
 * inherits, and the delivery note's "Received by" line is a suggestion in the
 * UI, not a default. A purchase order and a return go to a supplier / back to
 * a customer, so the shop's payment instructions don't belong on them.
 */
export const BUILT_IN_DOCUMENT_OVERRIDES: ReceiptDocumentOverrides = {
  purchaseOrder: { showPaymentDetails: false, showQr: false },
  return: { showPaymentDetails: false },
};

/** Effective override for one document: built-in defaults, then the merchant's. */
export const resolveDocumentOverride = (
  kind: ReceiptDocumentKind,
  saved?: ReceiptDocumentOverrides,
): ReceiptDocumentOverride => {
  const builtIn = BUILT_IN_DOCUMENT_OVERRIDES[kind] ?? {};
  const own = saved?.[kind] ?? {};
  return {
    ...builtIn,
    ...own,
    signature: { ...builtIn.signature, ...own.signature },
  };
};

export const DEFAULT_SIGNATURE_IMAGE_HEIGHT_MM = 18;
export const MAX_PAYMENT_DETAILS = 6;

export const DEFAULT_WATERMARK_SIZE: ReceiptWatermarkSize = { widthPct: 60, heightPct: 60 };
export const WATERMARK_SIZE_LIMITS: [number, number] = [20, 95];

export const getWatermarkPositionOptions = (
  t: Translator,
): { value: ReceiptWatermarkPosition; label: string }[] => [
  { value: "center", label: t("watermarkPositionOptions.center") },
  { value: "top", label: t("watermarkPositionOptions.top") },
  { value: "bottom", label: t("watermarkPositionOptions.bottom") },
];
export const DEFAULT_AMOUNT_IN_WORDS_LABEL = "In words:";

/**
 * Older builders seeded the tax line with a literal "Tax Reg. No" label and
 * orgs saved it verbatim. Treat that seed as unset so the translated
 * "VAT Reg. No (BIN)" prints — a merchant-typed label still wins.
 */
export const taxIdLineLabel = (label: string | undefined): string | undefined =>
  label && label.trim() !== "Tax Reg. No" ? label : undefined;

/** Fresh id for a header line — see `utils/local-id.ts` for why it isn't inline. */
export const newLineId = (): string => newLocalId("line");

/**
 * Seed the ordered identity lines from the classic fixed order — used the first
 * time an org opens the builder (before any custom order was saved). Matches the
 * renderer's `LEGACY_HEADER_ORDER` so the initial builder state reflects what
 * currently prints.
 */
export const seedHeaderLines = (): ReceiptHeaderLine[] =>
  [
    { source: "orgName" as const },
    { source: "taxId" as const },
    { source: "storeName" as const },
    { source: "address" as const },
    { source: "contact" as const },
  ].map((l) => ({ id: newLineId(), visible: true, ...l }));
