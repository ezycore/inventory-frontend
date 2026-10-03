// coding-standard: maintained
/**
 * The configurable blocks of a printed document (print-setup-v2 P2–P8): the
 * item table, the totals extras, the signature row, payment details, terms and
 * the QR code. Pure string builders used only by `composeDocument` in
 * `print-documents.ts`, so the preview and the printout stay one renderer.
 *
 * The rule every builder follows: with the setting UNSET it returns exactly
 * what the renderer printed before the setting existed (plan rule 2). Tests in
 * `print-documents.test.ts` pin the unset output.
 */
import qrcode from "qrcode-generator";

import type { Translator } from "@/i18n/config";
import type {
  ReceiptDocumentOverride,
  ReceiptItemColumns,
  ReceiptPaymentDetail,
  ReceiptTotalsOptions,
} from "@/types/receipt";
import { DEFAULT_SIGNATURE_IMAGE_HEIGHT_MM } from "@/types/receipt";
import { escapeHtml } from "./print";

type Paper = "a4" | "thermal80" | "thermal58";
type Tr = (key: string, fallback: string) => string;

export const trFor = (t: Translator | undefined): Tr => (key, fallback) =>
  t ? t(key) : fallback;

/** A raw-HTML cell (already escaped by its builder). Plain cells are escaped by the table. */
export interface HtmlCell {
  html: string;
}
export type PrintCell = string | number | HtmlCell;

export interface PrintColumn {
  header: string;
  align?: "left" | "right";
}

/** One structured item line; the table builder decides which parts print. */
export interface PrintItem {
  name: string;
  /** Snapshotted barcode (absent on older sales → blank). */
  code?: string;
  quantity: number;
  /** Snapshotted unit short name (absent on older sales → bare quantity). */
  unit?: string;
  /** Formatted unit price; omitted on quantity-only docs (delivery note). */
  price?: string;
  /** Formatted line discount when > 0. */
  discount?: string;
  vatRate?: number;
  /** Formatted line VAT when > 0. */
  vatAmount?: string;
  /** Formatted line amount; omitted on quantity-only docs. */
  amount?: string;
}

export interface ItemTableSpec {
  items: PrintItem[];
  /** Header of the per-unit money column (Price / Cost). */
  priceHeader?: string;
  /** Header of the line-total column (Amount / Refund). */
  amountHeader?: string;
  /** Delivery note: item + quantity only. */
  quantityOnly?: boolean;
}

/**
 * Build columns + rows from structured items and the org's column settings.
 * Unset settings reproduce the old fixed Item / Qty / Price / Amount table cell
 * for cell. Per-paper drops (plan P2 table): code goes under the name on
 * thermal; line discount is dropped on 58 mm; line VAT is rate-only on 80 mm
 * and dropped on 58 mm.
 */
export const buildItemTable = (
  spec: ItemTableSpec,
  cols: ReceiptItemColumns | undefined,
  paper: Paper,
  tr: Tr,
): { columns: PrintColumn[]; rows: PrintCell[][] } => {
  const thermal = paper !== "a4";
  const serial = cols?.serial === true;
  const unit = cols?.unit === true;
  const code = cols?.code === true;
  const priced = !spec.quantityOnly;
  const discount = priced && cols?.discount === true && paper !== "thermal58";
  const vatMode = priced ? cols?.vat ?? "off" : "off";
  const vatRate = vatMode !== "off" && paper !== "thermal58" && (vatMode === "rate" || vatMode === "both" || paper === "thermal80");
  const vatAmount = vatMode !== "off" && paper === "a4" && (vatMode === "amount" || vatMode === "both");
  const codeColumn = code && !thermal;
  const codeUnderName = code && thermal;

  const columns: PrintColumn[] = [];
  if (serial) columns.push({ header: tr("serialNo", "#") });
  columns.push({ header: tr("item", "Item") });
  if (codeColumn) columns.push({ header: tr("code", "Code") });
  columns.push({ header: tr("qty", "Qty"), align: "right" });
  if (priced) columns.push({ header: spec.priceHeader ?? tr("price", "Price"), align: "right" });
  if (discount) columns.push({ header: tr("lineDiscount", "Disc."), align: "right" });
  if (vatRate) columns.push({ header: tr("vatPercent", "VAT %"), align: "right" });
  if (vatAmount) columns.push({ header: tr("vatAmount", "VAT"), align: "right" });
  if (priced) columns.push({ header: spec.amountHeader ?? tr("amount", "Amount"), align: "right" });

  const rows = spec.items.map((item, i) => {
    const row: PrintCell[] = [];
    if (serial) row.push(i + 1);
    row.push(
      codeUnderName && item.code
        ? { html: `${escapeHtml(item.name)}<div class="muted item-code">${escapeHtml(item.code)}</div>` }
        : item.name,
    );
    if (codeColumn) row.push(item.code ?? "");
    row.push(unit && item.unit ? `${item.quantity} ${item.unit}` : item.quantity);
    if (priced) row.push(item.price ?? "");
    if (discount) row.push(item.discount ?? "");
    if (vatRate) row.push(item.vatRate ? `${item.vatRate}%` : "");
    if (vatAmount) row.push(item.vatAmount ?? "");
    if (priced) row.push(item.amount ?? "");
    return row;
  });
  return { columns, rows };
};

export interface TotalsRow {
  label: string;
  value: string;
  strong?: boolean;
  /** `paid` anchors the payment-method rows; `due` is hideable. */
  key?: "paid" | "due";
}

/** Snapshotted totals extras an adapter can offer; `applyTotalsOptions` decides. */
export interface TotalsExtras {
  /** One row per payment ("bKash · ৳500"). */
  payments?: TotalsRow[];
  /** Previous due / this invoice / total due, from the sale's snapshot. */
  previousBalance?: TotalsRow[];
  /** Cash received / change, from the sale's snapshot. */
  tendered?: TotalsRow[];
}

export const applyTotalsOptions = (
  rows: TotalsRow[],
  extras: TotalsExtras | undefined,
  opts: ReceiptTotalsOptions | undefined,
  paper: Paper,
): TotalsRow[] => {
  let out = opts?.showDue === false ? rows.filter((r) => r.key !== "due") : [...rows];
  if (opts?.showPaymentMethods && extras?.payments?.length) {
    const at = out.findIndex((r) => r.key === "paid");
    const insertAt = at >= 0 ? at + 1 : out.length;
    out = [...out.slice(0, insertAt), ...extras.payments, ...out.slice(insertAt)];
  }
  if (opts?.showPreviousBalance && extras?.previousBalance?.length) {
    out = [...out, ...extras.previousBalance];
  }
  const tendered = opts?.showTenderedChange ?? paper !== "a4";
  if (tendered && extras?.tendered?.length) out = [...out, ...extras.tendered];
  return out;
};

/** Translated payment-method name (cash / card / bank / mfs / other), else the raw value. */
export const paymentMethodLabel = (method: string, tr: Tr): string => {
  const known: Record<string, string> = {
    cash: "Cash",
    card: "Card",
    bank: "Bank",
    mfs: "Mobile banking",
    other: "Other",
  };
  return known[method] ? tr(`method_${method}`, known[method]) : method;
};

export interface SignatureInput {
  /** The document type carries a signature at all (invoice, receipt, delivery note). */
  allowed: boolean;
  enabled?: boolean;
  leftLabel?: string;
  rightLabel?: string;
  imageHeightMm?: number;
  signatureUrl?: string;
  stampUrl?: string;
}

/** The legacy built-in label, translated when it reaches the paper unchanged. */
const RECEIVED_BY = "Received by";

/**
 * Signature row (A4 only). Unset settings → the classic single "Authorized
 * Signature" line, byte-identical. A left label adds a second line; images sit
 * above the right line (signature) and over it (stamp).
 */
export const buildSignature = (sig: SignatureInput, paper: Paper, tr: Tr): string => {
  if (!sig.allowed || paper !== "a4" || sig.enabled === false) return "";
  const right = sig.rightLabel?.trim() || tr("authorizedSignature", "Authorized Signature");
  const leftRaw = sig.leftLabel?.trim();
  const left = leftRaw === RECEIVED_BY ? tr("receivedBy", RECEIVED_BY) : leftRaw;
  const hasImages = !!(sig.signatureUrl || sig.stampUrl);
  if (!left && !hasImages) {
    return `<div class="signature"><div class="signature-line">${escapeHtml(right)}</div></div>`;
  }
  const h = sig.imageHeightMm ?? DEFAULT_SIGNATURE_IMAGE_HEIGHT_MM;
  const images = hasImages
    ? `<div class="sig-images" style="height:${h}mm">${
        sig.signatureUrl
          ? `<img class="sig-img" src="${escapeHtml(sig.signatureUrl)}" alt="" style="max-height:${h}mm" />`
          : ""
      }${
        sig.stampUrl
          ? `<img class="stamp-img" src="${escapeHtml(sig.stampUrl)}" alt="" style="max-height:${h}mm" />`
          : ""
      }</div>`
    : "";
  const leftBlock = left
    ? `<div class="sig-block"><div class="signature-line">${escapeHtml(left)}</div></div>`
    : "<div></div>";
  return `<div class="signature two">${leftBlock}<div class="sig-block">${images}<div class="signature-line">${escapeHtml(right)}</div></div></div>`;
};

const WALLET_NAMES: Record<string, string> = {
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  upay: "Upay",
  other: "",
};

const walletLine = (d: ReceiptPaymentDetail, tr: Tr): string => {
  const provider = d.label?.trim() || WALLET_NAMES[d.provider ?? "other"] || tr("wallet", "Wallet");
  const type = d.accountType
    ? tr(`walletType_${d.accountType}`, d.accountType[0].toUpperCase() + d.accountType.slice(1))
    : "";
  return `${provider}${type ? ` (${type})` : ""}: ${d.number ?? ""}`;
};

/**
 * Payment instructions. A4: a two-column grid of bank and wallet cards.
 * Thermal: wallets only, one line each — a bank block doesn't fit a slip and
 * nobody wires money off a counter receipt.
 */
export const buildPaymentDetails = (
  details: ReceiptPaymentDetail[] | undefined,
  paper: Paper,
  tr: Tr,
): string => {
  const visible = (details ?? []).filter((d) => d.visible !== false);
  const rows = paper === "a4" ? visible : visible.filter((d) => d.kind === "wallet");
  if (rows.length === 0) return "";
  const title = `<div class="pay-title">${escapeHtml(tr("paymentDetails", "Payment details"))}</div>`;
  if (paper !== "a4") {
    return `<div class="hr"></div>${title}${rows
      .map((d) => `<div class="pay-line">${escapeHtml(walletLine(d, tr))}</div>`)
      .join("")}`;
  }
  const cards = rows
    .map((d) => {
      if (d.kind === "wallet") {
        return `<div class="pay-card">${escapeHtml(walletLine(d, tr))}</div>`;
      }
      const lines = [
        `<b>${escapeHtml(d.bankName ?? "")}</b>`,
        d.accountName ? `${escapeHtml(tr("accountName", "A/C name"))}: ${escapeHtml(d.accountName)}` : "",
        `${escapeHtml(tr("accountNumber", "A/C no."))}: ${escapeHtml(d.accountNumber ?? "")}`,
        d.branch ? `${escapeHtml(tr("branch", "Branch"))}: ${escapeHtml(d.branch)}` : "",
        d.routingNumber ? `${escapeHtml(tr("routingNumber", "Routing"))}: ${escapeHtml(d.routingNumber)}` : "",
      ].filter(Boolean);
      return `<div class="pay-card">${lines.map((l) => `<div>${l}</div>`).join("")}</div>`;
    })
    .join("");
  return `<div class="pay-block">${title}<div class="pay-grid">${cards}</div></div>`;
};

/** Terms & conditions — A4 only, small type, line breaks kept. */
export const buildTerms = (terms: string | null | undefined, paper: Paper): string => {
  const text = terms?.trim();
  if (!text || paper !== "a4") return "";
  return `<div class="terms">${escapeHtml(text)}</div>`;
};

/**
 * QR code as an inline SVG sized in mm, so print and preview need no image
 * load. Synchronous on purpose — the renderer must stay pure and sync.
 * Returns "" for an empty value or one too long to encode.
 */
export const buildQrSvg = (value: string, sizeMm: number): string => {
  const text = value.trim();
  if (!text) return "";
  try {
    const qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();
    const n = qr.getModuleCount();
    const quiet = 2;
    let path = "";
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (qr.isDark(r, c)) path += `M${c + quiet} ${r + quiet}h1v1h-1z`;
      }
    }
    const size = n + quiet * 2;
    return `<svg class="qr-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${sizeMm}mm" height="${sizeMm}mm" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
  } catch {
    return "";
  }
};

export const buildQrBlock = (
  value: string | undefined,
  label: string | undefined,
  sizeMm: number,
): string => {
  const svg = value ? buildQrSvg(value, sizeMm) : "";
  if (!svg) return "";
  const caption = label?.trim() ? `<div class="qr-label">${escapeHtml(label.trim())}</div>` : "";
  return `<div class="qr">${svg}${caption}</div>`;
};

/** Footer / terms after a per-document override: `null` = none, unset = inherit. */
export const pickOverridable = (
  own: string | null | undefined,
  global: string | undefined,
): string | undefined => (own === null ? undefined : own ?? global);

export type { ReceiptDocumentOverride };
