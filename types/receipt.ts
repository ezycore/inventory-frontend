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
  headerLines?: ReceiptHeaderLine[];
  metaFields?: ReceiptMetaFields;
  /** Print the document title line ("Tax Invoice" / "Purchase Order" …). Unset → true. */
  showDocTitle?: boolean;
  showAmountInWords?: boolean;
  amountInWordsLabel?: string;
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
