// coding-standard: maintained
import { useState } from "react";

import {
  DEFAULT_AMOUNT_IN_WORDS_LABEL,
  DEFAULT_META_FIELDS,
  DEFAULT_WATERMARK_OPACITY,
  newLineId,
  seedHeaderLines,
  type ReceiptHeaderAlign,
  type ReceiptHeaderLine,
  type ReceiptLogoPlacement,
  type ReceiptMetaKey,
  type ReceiptPaperSize,
  type ReceiptSettings,
} from "@/types/receipt";

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
  headerLines: ReceiptHeaderLine[];
  metaFields: Record<ReceiptMetaKey, boolean>;
  showDocTitle: boolean;
  showAmountInWords: boolean;
  amountInWordsLabel: string;
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
  // Seed the classic order the first time (before any custom order was saved).
  headerLines:
    saved?.headerLines && saved.headerLines.length > 0
      ? saved.headerLines
      : seedHeaderLines(),
  metaFields: { ...DEFAULT_META_FIELDS, ...(saved?.metaFields ?? {}) },
  showDocTitle: saved?.showDocTitle !== false,
  showAmountInWords: saved?.showAmountInWords !== false,
  amountInWordsLabel: saved?.amountInWordsLabel ?? DEFAULT_AMOUNT_IN_WORDS_LABEL,
});

/**
 * Owns the letterhead-builder form state. Seeds from the saved org settings and
 * re-syncs when fresh server values arrive (keyed on a JSON signature so an
 * in-progress edit isn't clobbered). Exposes the line/meta mutators the builder
 * needs and a `buildPayload` that shapes the nested `receiptSettings` the update
 * endpoint expects.
 */
export const useReceiptSettings = (saved?: ReceiptSettings) => {
  const serverSig = JSON.stringify(saved ?? {});
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
    headerLines: state.headerLines,
    metaFields: state.metaFields,
    showDocTitle: state.showDocTitle,
    showAmountInWords: state.showAmountInWords,
    amountInWordsLabel: state.amountInWordsLabel,
  });

  return { state, actions, hasChanges, buildPayload };
};
