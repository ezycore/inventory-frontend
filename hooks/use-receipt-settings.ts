// coding-standard: maintained
import { useState } from "react";

import {
  DEFAULT_AMOUNT_IN_WORDS_LABEL,
  DEFAULT_META_FIELDS,
  DEFAULT_WATERMARK_OPACITY,
  DEFAULT_WATERMARK_SIZE,
  newLineId,
  seedHeaderLines,
  type ReceiptHeaderAlign,
  type ReceiptHeaderLine,
  type ReceiptLogoBox,
  type ReceiptLogoPlacement,
  type ReceiptLogoSize,
  type ReceiptMetaKey,
  type ReceiptPaperSize,
  type ReceiptSettings,
  type ReceiptWatermarkPosition,
  type ReceiptWatermarkSize,
  type ReceiptDocumentKind,
  type ReceiptDocumentOverride,
  type ReceiptDocumentOverrides,
  type ReceiptItemColumns,
  type ReceiptPaymentDetail,
  type ReceiptQrSettings,
  type ReceiptSignatureSettings,
  type ReceiptThermalSettings,
  type ReceiptTotalsOptions,
  MAX_PAYMENT_DETAILS,
} from "@/types/receipt";
import { newLocalId } from "@/utils/local-id";

/** Flat editable state backing the letterhead builder. */
export interface ReceiptFormState {
  phone: string;
  email: string;
  taxId: string;
  footer: string;
  paper: ReceiptPaperSize;
  align: ReceiptHeaderAlign;
  logoPlacement: ReceiptLogoPlacement;
  watermarkOpacity: number;
  /** Only papers the merchant sized; a missing paper keeps the built-in size. */
  logoSize: ReceiptLogoSize;
  /** Unset until edited → the renderer's 60 × 60 default. */
  watermarkSize?: ReceiptWatermarkSize;
  watermarkPosition: ReceiptWatermarkPosition;
  headerLines: ReceiptHeaderLine[];
  metaFields: Record<ReceiptMetaKey, boolean>;
  showDocTitle: boolean;
  showAmountInWords: boolean;
  amountInWordsLabel: string;
  // print-setup-v2 P2–P8. Objects stay sparse: an unset key keeps its default.
  itemColumns: ReceiptItemColumns;
  totals: ReceiptTotalsOptions;
  signature: ReceiptSignatureSettings;
  paymentDetails: ReceiptPaymentDetail[];
  terms: string;
  qr: ReceiptQrSettings;
  documents: ReceiptDocumentOverrides;
  thermal: ReceiptThermalSettings;
  /** Unset → 1. */
  copies?: number;
  copyLabels: string[];
  autoPrintAfterSale: boolean;
}

export interface ReceiptSettingsActions {
  update: (patch: Partial<ReceiptFormState>) => void;
  moveLine: (id: string, dir: -1 | 1) => void;
  toggleLine: (id: string) => void;
  setLineLabel: (id: string, label: string) => void;
  setLineText: (id: string, text: string) => void;
  addCustomLine: () => void;
  removeLine: (id: string) => void;
  toggleMeta: (key: ReceiptMetaKey) => void;
  /** `null` drops the paper's box → back to the built-in size. */
  setLogoBox: (paper: ReceiptPaperSize, box: ReceiptLogoBox | null) => void;
  /** Back to the built-in layout; keeps contact details, footer, terms and payment details. */
  resetToDefaults: () => void;
  patchItemColumns: (patch: Partial<ReceiptItemColumns>) => void;
  patchTotals: (patch: Partial<ReceiptTotalsOptions>) => void;
  patchSignature: (patch: Partial<ReceiptSignatureSettings>) => void;
  patchQr: (patch: Partial<ReceiptQrSettings>) => void;
  patchThermal: (patch: Partial<ReceiptThermalSettings>) => void;
  addPaymentDetail: (kind: ReceiptPaymentDetail["kind"]) => void;
  updatePaymentDetail: (id: string, patch: Partial<ReceiptPaymentDetail>) => void;
  movePaymentDetail: (id: string, dir: -1 | 1) => void;
  removePaymentDetail: (id: string) => void;
  /** Replace one document's override (an empty object = inherit everything). */
  setDocumentOverride: (kind: ReceiptDocumentKind, override: ReceiptDocumentOverride) => void;
}

/** Derive the editable form state from the saved settings (with legacy fallbacks). */
const fromSaved = (saved?: ReceiptSettings): ReceiptFormState => ({
  phone: saved?.phone ?? "",
  email: saved?.email ?? "",
  taxId: saved?.taxId ?? "",
  footer: saved?.footer ?? "",
  paper: saved?.defaultPaperSize ?? "a4",
  align: saved?.headerAlign ?? "left",
  // Placement is authoritative; fall back to the legacy boolean for old orgs.
  logoPlacement:
    saved?.logoPlacement ?? (saved?.showLogo === false ? "hidden" : "top"),
  watermarkOpacity: saved?.watermarkOpacity ?? DEFAULT_WATERMARK_OPACITY,
  logoSize: saved?.logoSize ?? {},
  watermarkSize: saved?.watermarkSize,
  watermarkPosition: saved?.watermarkPosition ?? "center",
  // Seed the classic order the first time (before any custom order was saved).
  headerLines:
    saved?.headerLines && saved.headerLines.length > 0
      ? saved.headerLines
      : seedHeaderLines(),
  metaFields: { ...DEFAULT_META_FIELDS, ...(saved?.metaFields ?? {}) },
  showDocTitle: saved?.showDocTitle !== false,
  showAmountInWords: saved?.showAmountInWords !== false,
  amountInWordsLabel: saved?.amountInWordsLabel ?? DEFAULT_AMOUNT_IN_WORDS_LABEL,
  itemColumns: saved?.itemColumns ?? {},
  totals: saved?.totals ?? {},
  signature: saved?.signature ?? {},
  paymentDetails: saved?.paymentDetails ?? [],
  terms: saved?.terms ?? "",
  qr: saved?.qr ?? {},
  documents: saved?.documents ?? {},
  thermal: saved?.thermal ?? {},
  copies: saved?.copies,
  copyLabels: saved?.copyLabels ?? [],
  autoPrintAfterSale: saved?.autoPrintAfterSale === true,
});

/**
 * Owns the letterhead-builder form state. Seeds from the saved org settings and
 * re-syncs when fresh server values arrive (keyed on a JSON signature so an
 * in-progress edit isn't clobbered). Exposes the line/meta mutators the builder
 * needs and a `buildPayload` that shapes the nested `receiptSettings` the update
 * endpoint expects.
 */
export const useReceiptSettings = (saved?: ReceiptSettings) => {
  // The signature/stamp images upload on their own (not part of this draft), so
  // they're left out of the signature: an upload must not reset unsaved edits.
  const { signatureImage: _sig, stampImage: _stamp, ...formSaved } = saved ?? {};
  const serverSig = JSON.stringify(formSaved);
  const [syncedSig, setSyncedSig] = useState(serverSig);
  const [initial, setInitial] = useState(() => fromSaved(saved));
  const [state, setState] = useState(initial);

  // Resync on fresh server values (e.g. after a save invalidates the org query).
  if (serverSig !== syncedSig) {
    const next = fromSaved(saved);
    setSyncedSig(serverSig);
    setInitial(next);
    setState(next);
  }

  const patchLines = (fn: (lines: ReceiptHeaderLine[]) => ReceiptHeaderLine[]) =>
    setState((s) => ({ ...s, headerLines: fn(s.headerLines) }));

  const actions: ReceiptSettingsActions = {
    update: (patch) => setState((s) => ({ ...s, ...patch })),
    moveLine: (id, dir) =>
      patchLines((lines) => {
        const i = lines.findIndex((l) => l.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= lines.length) return lines;
        const next = [...lines];
        [next[i], next[j]] = [next[j], next[i]];
        return next;
      }),
    toggleLine: (id) =>
      patchLines((lines) =>
        lines.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
      ),
    setLineLabel: (id, label) =>
      patchLines((lines) =>
        lines.map((l) => (l.id === id ? { ...l, label } : l)),
      ),
    setLineText: (id, text) =>
      patchLines((lines) =>
        lines.map((l) => (l.id === id ? { ...l, text } : l)),
      ),
    addCustomLine: () =>
      patchLines((lines) => [
        ...lines,
        { id: newLineId(), source: "custom", label: "", text: "", visible: true },
      ]),
    removeLine: (id) => patchLines((lines) => lines.filter((l) => l.id !== id)),
    toggleMeta: (key) =>
      setState((s) => ({
        ...s,
        metaFields: { ...s.metaFields, [key]: !s.metaFields[key] },
      })),
    setLogoBox: (paper, box) =>
      setState((s) => {
        const logoSize = { ...s.logoSize };
        if (box) logoSize[paper] = box;
        else delete logoSize[paper];
        return { ...s, logoSize };
      }),
    resetToDefaults: () =>
      setState((s) => ({
        ...fromSaved(undefined),
        phone: s.phone,
        email: s.email,
        taxId: s.taxId,
        footer: s.footer,
        terms: s.terms,
        paymentDetails: s.paymentDetails,
      })),
    patchItemColumns: (patch) =>
      setState((s) => ({ ...s, itemColumns: { ...s.itemColumns, ...patch } })),
    patchTotals: (patch) => setState((s) => ({ ...s, totals: { ...s.totals, ...patch } })),
    patchSignature: (patch) =>
      setState((s) => ({ ...s, signature: { ...s.signature, ...patch } })),
    patchQr: (patch) => setState((s) => ({ ...s, qr: { ...s.qr, ...patch } })),
    patchThermal: (patch) => setState((s) => ({ ...s, thermal: { ...s.thermal, ...patch } })),
    addPaymentDetail: (kind) =>
      setState((s) =>
        s.paymentDetails.length >= MAX_PAYMENT_DETAILS
          ? s
          : {
              ...s,
              paymentDetails: [
                ...s.paymentDetails,
                kind === "bank"
                  ? { id: newLocalId("pay"), kind, visible: true, bankName: "", accountName: "", accountNumber: "" }
                  : { id: newLocalId("pay"), kind, visible: true, provider: "bkash", accountType: "personal", number: "" },
              ],
            },
      ),
    updatePaymentDetail: (id, patch) =>
      setState((s) => ({
        ...s,
        paymentDetails: s.paymentDetails.map((d) => (d.id === id ? { ...d, ...patch } : d)),
      })),
    movePaymentDetail: (id, dir) =>
      setState((s) => {
        const i = s.paymentDetails.findIndex((d) => d.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= s.paymentDetails.length) return s;
        const next = [...s.paymentDetails];
        [next[i], next[j]] = [next[j], next[i]];
        return { ...s, paymentDetails: next };
      }),
    removePaymentDetail: (id) =>
      setState((s) => ({ ...s, paymentDetails: s.paymentDetails.filter((d) => d.id !== id) })),
    setDocumentOverride: (kind, override) =>
      setState((s) => ({ ...s, documents: { ...s.documents, [kind]: override } })),
  };

  const hasChanges = JSON.stringify(state) !== JSON.stringify(initial);

  /** Shape the nested `receiptSettings` partial the update endpoint persists. */
  const buildPayload = (): ReceiptSettings => ({
    phone: state.phone,
    email: state.email,
    taxId: state.taxId,
    footer: state.footer,
    defaultPaperSize: state.paper,
    headerAlign: state.align,
    logoPlacement: state.logoPlacement,
    watermarkOpacity: state.watermarkOpacity,
    logoSize: state.logoSize,
    // Omitted until edited. After a reset of a saved size, send the default so
    // the server copy is overwritten (an omitted key is left untouched).
    ...(state.watermarkSize || initial.watermarkSize
      ? { watermarkSize: state.watermarkSize ?? DEFAULT_WATERMARK_SIZE }
      : {}),
    watermarkPosition: state.watermarkPosition,
    headerLines: state.headerLines,
    metaFields: state.metaFields,
    showDocTitle: state.showDocTitle,
    showAmountInWords: state.showAmountInWords,
    amountInWordsLabel: state.amountInWordsLabel,
    itemColumns: state.itemColumns,
    totals: state.totals,
    signature: state.signature,
    paymentDetails: state.paymentDetails,
    terms: state.terms,
    qr: state.qr,
    documents: state.documents,
    thermal: state.thermal,
    // Always sent (1 = default) so a reset overwrites a saved count.
    copies: state.copies ?? 1,
    copyLabels: state.copyLabels,
    autoPrintAfterSale: state.autoPrintAfterSale,
  });

  return { state, actions, hasChanges, buildPayload };
};
