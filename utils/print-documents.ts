// coding-standard: maintained
import type { PurchaseOrder, Sale, SaleItem } from "@/types";
import type { ReturnDetailsData } from "@/components/shared/returns";
import type {
  ReceiptSettings,
  ReceiptLogoPlacement,
  ReceiptHeaderLine,
  ReceiptMetaFields,
  ReceiptMetaKey,
} from "@/types/receipt";
import { formatCurrency } from "@/lib/currency";
import { amountToWords } from "./number-to-words";
import { escapeHtml, printHtml } from "./print";

/**
 * POS document printing (invoice / receipt / purchase order) on top of the
 * shared `printHtml`. A generic doc model + renderer is fed by per-entity
 * adapters, so Sale and PurchaseOrder share one layout across three paper
 * sizes: A4 and thermal 80mm / 58mm.
 */

export type PaperSize = "a4" | "thermal80" | "thermal58";

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
  docTitle: string;
  number: string;
  /** `key` (when set) lets a receipt setting hide this row; keyless rows always print. */
  meta: { label: string; value: string; key?: MetaKey }[];
  columns: PrintDocColumn[];
  /** Pre-formatted cells (currency already applied by the adapter). */
  rows: (string | number)[][];
  totals: { label: string; value: string; strong?: boolean }[];
  /** Grand total spelled out (invoice "amount in words" line). Omitted when unset. */
  amountInWords?: string;
  notes?: string;
  /** Render an authorized-signature block (A4 only; skipped on thermal). */
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
  /** Letterhead alignment; unset → per-paper default (A4 left, thermal centered). */
  align?: "left" | "center" | "right";
  /** Logo placement. Unset → "top". Watermark/both render a faint centered image (A4 only). */
  logoPlacement?: PrintLogoPlacement;
  /** Watermark opacity 0.03–0.20. Unset → 0.08. */
  watermarkOpacity?: number;
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
}

/** Minimal org shape the print header is built from (auth-store organization). */
export interface PrintableOrg {
  name?: string;
  logo?: { url?: string; mediumUrl?: string; thumbnailUrl?: string } | null;
  address?: string;
  receiptSettings?: ReceiptSettings;
}

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
    headerLines: rs?.headerLines,
    metaFields: rs?.metaFields,
    showDocTitle: rs?.showDocTitle,
    showAmountInWords: rs?.showAmountInWords,
    amountInWordsLabel: rs?.amountInWordsLabel,
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
): string => {
  switch (line.source) {
    case "orgName":
      return header.orgName
        ? `<div class="org">${escapeHtml(header.orgName)}</div>`
        : "";
    case "taxId":
      return header.taxId
        ? `<div class="muted contact">${escapeHtml(line.label || "Tax Reg. No")}: ${escapeHtml(header.taxId)}</div>`
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
const resolveHeaderLines = (header: DocHeader, contactLine: string): string[] => {
  const lines =
    header.headerLines && header.headerLines.length > 0
      ? header.headerLines.filter((l) => l.visible)
      : LEGACY_HEADER_ORDER.map((source) => ({ source }));
  return lines
    .map((line) => renderHeaderLine(line, header, contactLine))
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
): { body: string; styles: string; title: string } => {
  const contactLine = [header.phone, header.email].filter(Boolean).join(" · ");
  // Explicit alignment overrides the paper default (A4 left, thermal centered).
  const alignStyle = header.align ? ` style="text-align:${header.align}"` : "";
  // Centered/right letterheads read as the classic stacked head; the default
  // (left) A4 layout puts the document title opposite the identity block.
  const stacked = header.align === "center" || header.align === "right";

  // Logo placement. Watermark is A4-only (thermal is 1-bit: a grey wash either
  // vanishes or smears solid), so on thermal only the top-logo part of "both" runs.
  const placement = header.logoPlacement ?? "top";
  const hasLogo = !!header.logoUrl;
  const showTopLogo =
    hasLogo && (placement === "top" || placement === "both");
  const showWatermark =
    hasLogo && paper === "a4" && (placement === "watermark" || placement === "both");
  const opacity = Math.min(0.2, Math.max(0.03, header.watermarkOpacity ?? 0.08));
  const watermark = showWatermark
    ? `<img class="watermark" src="${escapeHtml(header.logoUrl!)}" alt="" style="opacity:${opacity}" />`
    : "";
  const topLogo = showTopLogo
    ? `<img class="logo" src="${escapeHtml(header.logoUrl!)}" alt="" />`
    : "";

  // Meta rows: drop any keyed row the org switched off (keyless rows always print).
  const metaHtml = doc.meta
    .filter((m) => !m.key || header.metaFields?.[m.key] !== false)
    .map((m) => `<div>${escapeHtml(m.label)}: <b>${escapeHtml(m.value)}</b></div>`)
    .join("");

  // Document title ("Tax Invoice" etc.) is togglable; the number line always prints.
  const docTitle =
    header.showDocTitle === false
      ? ""
      : `<div class="doc-title">${escapeHtml(doc.docTitle)}</div>`;

  const head = `
    <div class="header${stacked ? " stack" : ""}"${alignStyle}>
      <div class="ident">
        ${topLogo}
        ${resolveHeaderLines(header, contactLine).join("")}
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

  const thead = `<tr>${doc.columns
    .map((c) => `<th class="${c.align === "right" ? "num" : ""}">${escapeHtml(c.header)}</th>`)
    .join("")}</tr>`;
  const tbody = doc.rows
    .map(
      (row) =>
        `<tr>${row
          .map(
            (cell, i) =>
              `<td class="${doc.columns[i]?.align === "right" ? "num" : ""}">${escapeHtml(cell)}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("");

  const totals = `<table class="totals">${doc.totals
    .map(
      (t) =>
        `<tr class="${t.strong ? "strong" : ""}"><td>${escapeHtml(t.label)}</td><td class="t-val">${escapeHtml(t.value)}</td></tr>`,
    )
    .join("")}</table>`;

  // Amount in words: gated by the org toggle (default on) with a configurable caption.
  const amountInWords =
    doc.amountInWords && header.showAmountInWords !== false
      ? `<div class="words"><span class="muted">${escapeHtml(header.amountInWordsLabel || "In words:")}</span> <b>${escapeHtml(doc.amountInWords)}</b></div>`
      : "";

  const notes = doc.notes
    ? `<div class="hr"></div><div class="muted">${escapeHtml(doc.notes)}</div>`
    : "";

  // Authorized-signature block — full documents only (looks wrong on a thermal slip).
  const signature =
    doc.signature && paper === "a4"
      ? `<div class="signature"><div class="signature-line">Authorized Signature</div></div>`
      : "";

  const footer = header.footer
    ? `<div class="hr"></div><div class="muted footer">${escapeHtml(header.footer)}</div>`
    : "";

  // Watermark sits outside `.doc` (fixed, z-index 0) so it stays behind content.
  const body = `${watermark}<div class="doc">${head}<div class="hr"></div><table class="items">${thead}${tbody}</table>${totals}${amountInWords}${signature}${notes}${footer}</div>`;

  return {
    body,
    styles: BASE_STYLES + PAPER_STYLES[paper],
    title: `${doc.docTitle} ${doc.number}`,
  };
};

/** Render a generic PrintDoc to a print window at the chosen paper size. */
const printDoc = (doc: PrintDoc, paper: PaperSize, header: DocHeader): boolean => {
  const { body, styles, title } = composeDocument(doc, paper, header);
  return printHtml(body, { title, styles });
};

const dateStr = (value?: string | Date): string =>
  value ? new Date(value).toLocaleString() : "";

type Currency = (n: number) => string;

/**
 * Group the sale's per-line tax snapshot into `Tax <rate>%` rows (only rates
 * that actually carried tax). Empty when no line was taxed — the caller then
 * falls back to a single "Tax" line (or nothing).
 */
const taxByRate = (items: SaleItem[], currency: Currency): PrintDoc["totals"] => {
  const byRate = new Map<number, number>();
  for (const item of items) {
    const amount = item.taxAmount ?? 0;
    if (amount <= 0) continue;
    const rate = item.taxRate ?? 0;
    byRate.set(rate, (byRate.get(rate) ?? 0) + amount);
  }
  return [...byRate.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([rate, amount]) => ({ label: `Tax ${rate}%`, value: currency(amount) }));
};

const saleToDoc = (sale: Sale, currency: Currency): PrintDoc => {
  const totals: PrintDoc["totals"] = [
    { label: "Subtotal", value: currency(sale.subtotal) },
  ];
  if (sale.additionalDiscount > 0) {
    totals.push({ label: "Discount", value: `- ${currency(sale.additionalDiscount)}` });
  }
  // Tax by rate when the per-line snapshot is present; else a single Tax line.
  const taxRows = taxByRate(sale.items, currency);
  if (taxRows.length > 0) {
    totals.push(...taxRows);
  } else if (sale.taxTotal && sale.taxTotal > 0) {
    totals.push({ label: "Tax", value: currency(sale.taxTotal) });
  }
  totals.push({ label: "Total", value: currency(sale.totalAmount), strong: true });
  totals.push({ label: "Paid", value: currency(sale.paidAmount) });
  if (sale.dueAmount > 0) {
    totals.push({ label: "Due", value: currency(sale.dueAmount), strong: true });
  }

  const hasTax =
    (sale.taxTotal ?? 0) > 0 || sale.items.some((item) => (item.taxAmount ?? 0) > 0);
  const customer = sale.customerId;
  // Only show a cashier line when the name is actually populated — a raw sale
  // (e.g. a POST response) carries `createdBy` as an id, which would otherwise
  // print "undefined undefined".
  const cashierName = `${sale.createdBy?.firstName ?? ""} ${sale.createdBy?.lastName ?? ""}`.trim();

  return {
    // "Tax Invoice" is the accepted wording once any tax applies.
    docTitle: hasTax ? "Tax Invoice" : "Invoice",
    number: sale.invoiceNumber,
    meta: [
      { label: "Date", value: dateStr(sale.createdAt) },
      { label: "Customer", value: customer?.name ?? "Walk-in Customer", key: "customer" },
      ...(customer?.phone
        ? [{ label: "Phone", value: customer.phone, key: "phone" as const }]
        : []),
      ...(customer?.address
        ? [{ label: "Address", value: customer.address, key: "address" as const }]
        : []),
      { label: "Status", value: sale.status, key: "status" },
      ...(cashierName
        ? [{ label: "Cashier", value: cashierName, key: "cashier" as const }]
        : []),
    ],
    columns: [
      { header: "Item" },
      { header: "Qty", align: "right" },
      { header: "Price", align: "right" },
      { header: "Amount", align: "right" },
    ],
    rows: sale.items.map((item) => [
      item.comboName ? `${item.productName} (in ${item.comboName})` : item.productName,
      item.quantity,
      currency(item.price),
      currency(item.subtotal),
    ]),
    totals,
    amountInWords: amountToWords(sale.totalAmount),
    notes: sale.notes,
    signature: true,
  };
};

const purchaseOrderToDoc = (order: PurchaseOrder, currency: Currency): PrintDoc => {
  const grand = order.grandTotal ?? order.totalAmount ?? order.subtotal;
  const totals: PrintDoc["totals"] = [
    { label: "Subtotal", value: currency(order.subtotal) },
  ];
  if (order.additionalDiscount && order.additionalDiscount > 0) {
    totals.push({ label: "Discount", value: `- ${currency(order.additionalDiscount)}` });
  }
  if (order.taxTotal > 0) {
    totals.push({ label: "Tax", value: currency(order.taxTotal) });
  }
  totals.push({ label: "Grand Total", value: currency(grand), strong: true });
  if (order.paidAmount && order.paidAmount > 0) {
    totals.push({ label: "Paid", value: currency(order.paidAmount) });
  }
  if (order.dueAmount && order.dueAmount > 0) {
    totals.push({ label: "Due", value: currency(order.dueAmount), strong: true });
  }

  const supplierName = order.supplierId?.name ?? order.supplier?.name ?? "-";

  return {
    docTitle: "Purchase Order",
    number: order.orderNumber,
    meta: [
      { label: "Date", value: dateStr(order.invoiceDate ?? order.createdAt) },
      { label: "Supplier", value: supplierName },
      { label: "Status", value: order.status, key: "status" },
      ...(order.invoiceNumber ? [{ label: "Invoice #", value: order.invoiceNumber }] : []),
    ],
    columns: [
      { header: "Item" },
      { header: "Qty", align: "right" },
      { header: "Price", align: "right" },
      { header: "Amount", align: "right" },
    ],
    rows: order.items.map((item) => [
      item.productName ?? item.product?.name ?? "-",
      item.quantity,
      currency(item.price),
      currency(item.subtotal),
    ]),
    totals,
    notes: order.notes,
  };
};

const returnToDoc = (
  data: ReturnDetailsData,
  variant: "sales" | "purchases",
  currency: Currency,
): PrintDoc => {
  const isSales = variant === "sales";
  const totals: PrintDoc["totals"] = [];
  if (data.deductionAmount && data.deductionAmount > 0) {
    totals.push({ label: "Deduction", value: `- ${currency(data.deductionAmount)}` });
  }
  totals.push({
    label: "Total Refund",
    value: currency(data.totalRefundAmount),
    strong: true,
  });
  if (data.refundedAmount !== undefined) {
    totals.push({ label: "Refunded", value: currency(data.refundedAmount) });
  }

  return {
    docTitle: isSales ? "Sales Return" : "Purchase Return",
    number: data.returnNumber,
    meta: [
      { label: "Date", value: dateStr(data.date) },
      {
        label: isSales ? "Original Invoice" : "Original Order",
        value: data.documentRef,
      },
      {
        label: isSales ? "Customer" : "Supplier",
        value: data.counterpartyName ?? "-",
        ...(isSales ? { key: "customer" as const } : {}),
      },
      { label: "Status", value: data.status, key: "status" },
      ...(data.reason ? [{ label: "Reason", value: data.reason }] : []),
    ],
    columns: [
      { header: "Item" },
      { header: "Qty", align: "right" },
      { header: isSales ? "Price" : "Cost", align: "right" },
      { header: "Refund", align: "right" },
    ],
    rows: data.items.map((item) => [
      item.comboName ? `${item.productName} (in ${item.comboName})` : item.productName,
      item.quantity,
      currency(isSales ? item.price ?? 0 : item.costPrice),
      currency(item.refundAmount),
    ]),
    totals,
    notes: data.notes,
  };
};

interface PrintEntityOptions {
  paper: PaperSize;
  currency: Currency;
  /** Letterhead header — build via {@link orgToPrintHeader}. */
  header: DocHeader;
}

/** Print a sale as an invoice (A4) or receipt (thermal). Returns false if printing could not start. */
export const printSaleInvoice = (sale: Sale, opts: PrintEntityOptions): boolean =>
  printDoc(saleToDoc(sale, opts.currency), opts.paper, opts.header);

/** Print a purchase order. Returns false if printing could not start. */
export const printPurchaseOrder = (
  order: PurchaseOrder,
  opts: PrintEntityOptions,
): boolean =>
  printDoc(purchaseOrderToDoc(order, opts.currency), opts.paper, opts.header);

/** Print a sales/purchase return (credit/debit note). Returns false if printing could not start. */
export const printReturn = (
  data: ReturnDetailsData,
  variant: "sales" | "purchases",
  opts: PrintEntityOptions,
): boolean => printDoc(returnToDoc(data, variant, opts.currency), opts.paper, opts.header);

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
): PrintDoc => ({
  docTitle: "Payment Receipt",
  number: p.docNumber,
  meta: [
    { label: "Date", value: dateStr(p.createdAt) },
    { label: p.isSale ? "Received from" : "Paid to", value: p.counterparty },
    { label: "Method", value: p.paymentMethod },
    ...(p.accountName ? [{ label: "Account", value: p.accountName }] : []),
  ],
  columns: [{ header: "Description" }, { header: "Amount", align: "right" }],
  rows: [[`Payment against ${p.docNumber}`, currency(p.amount)]],
  totals: [
    {
      label: p.isSale ? "Amount received" : "Amount paid",
      value: currency(p.amount),
      strong: true,
    },
    ...(p.balanceDue != null
      ? [{ label: "Balance due", value: currency(p.balanceDue) }]
      : []),
  ],
  amountInWords: amountToWords(p.amount),
  notes: p.notes,
  signature: true,
});

/** Print a money receipt for a single payment. Returns false if printing could not start. */
export const printPaymentReceipt = (
  input: PaymentReceiptInput,
  opts: PrintEntityOptions,
): boolean =>
  printDoc(paymentReceiptToDoc(input, opts.currency), opts.paper, opts.header);

/**
 * Delivery note / challan: the sale's items + quantities with NO prices or money
 * — a goods-dispatch document. Built from the same populated sale as the invoice.
 */
const saleToDeliveryDoc = (sale: Sale): PrintDoc => {
  const customer = sale.customerId;
  const totalUnits = sale.items.reduce((sum, i) => sum + (i.quantity ?? 0), 0);
  return {
    docTitle: "Delivery Note",
    number: sale.invoiceNumber,
    meta: [
      { label: "Date", value: dateStr(sale.createdAt) },
      { label: "Customer", value: customer?.name ?? "Walk-in Customer", key: "customer" },
      ...(customer?.phone
        ? [{ label: "Phone", value: customer.phone, key: "phone" as const }]
        : []),
      ...(customer?.address
        ? [{ label: "Address", value: customer.address, key: "address" as const }]
        : []),
    ],
    columns: [{ header: "Item" }, { header: "Qty", align: "right" }],
    rows: sale.items.map((item) => [
      item.comboName ? `${item.productName} (in ${item.comboName})` : item.productName,
      item.quantity,
    ]),
    totals: [{ label: "Total units", value: String(totalUnits), strong: true }],
    notes: sale.notes,
    signature: true,
  };
};

/** Print a sale as a delivery note / challan (no prices). Returns false if printing could not start. */
export const printDeliveryNote = (sale: Sale, opts: PrintEntityOptions): boolean =>
  printDoc(saleToDeliveryDoc(sale), opts.paper, opts.header);

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

const STATEMENT_TXN_LABEL: Record<StatementTxn["type"], string> = {
  invoice: "Invoice",
  payment: "Payment",
  refund: "Cash refund",
  return: "Return",
  credit: "Credit applied",
};

const statementToDoc = (s: StatementInput, currency: Currency): PrintDoc => ({
  docTitle: s.title,
  number: dateStr(new Date()),
  meta: [
    { label: s.partyLabel, value: s.partyName },
    ...(s.partyPhone ? [{ label: "Phone", value: s.partyPhone }] : []),
  ],
  columns: [
    { header: "Date" },
    { header: "Transaction" },
    { header: "Amount", align: "right" },
  ],
  rows: s.transactions.map((t) => [
    dateStr(t.date),
    `${STATEMENT_TXN_LABEL[t.type]}${t.reference ? ` ${t.reference}` : ""}`,
    currency(t.amount),
  ]),
  totals: s.summary.map((r) => ({
    label: r.label,
    value: currency(r.value),
    strong: r.strong,
  })),
});

/** Print a customer/supplier account statement. Returns false if printing could not start. */
export const printStatement = (
  input: StatementInput,
  opts: PrintEntityOptions,
): boolean => printDoc(statementToDoc(input, opts.currency), opts.paper, opts.header);

/**
 * A representative invoice used to render the receipt live-preview. Mirrors the
 * real printout's tax behaviour: with tax active it reads "Tax Invoice" and shows
 * the tax line; without it, a plain "Invoice" at the pre-tax total.
 */
const buildSampleInvoiceDoc = (
  currency: Currency,
  hasTax: boolean,
): PrintDoc => {
  const total = hasTax ? 840 : 800;
  return {
    docTitle: hasTax ? "Tax Invoice" : "Invoice",
    number: "INV-0001",
    meta: [
      { label: "Date", value: dateStr(new Date()) },
      { label: "Customer", value: "John Doe", key: "customer" },
      { label: "Phone", value: "01700-000000", key: "phone" },
      { label: "Status", value: "completed", key: "status" },
    ],
    columns: [
      { header: "Item" },
      { header: "Qty", align: "right" },
      { header: "Price", align: "right" },
      { header: "Amount", align: "right" },
    ],
    rows: [
      ["Sample product A", 2, currency(150), currency(300)],
      ["Sample product B", 1, currency(500), currency(500)],
    ],
    totals: [
      { label: "Subtotal", value: currency(800) },
      ...(hasTax ? [{ label: "Tax 5%", value: currency(40) }] : []),
      { label: "Total", value: currency(total), strong: true },
      { label: "Paid", value: currency(total) },
    ],
    amountInWords: amountToWords(total),
    signature: true,
  };
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
  headerLines?: PrintHeaderLine[];
  metaFields?: PrintMetaFields;
  showDocTitle?: boolean;
  showAmountInWords?: boolean;
  amountInWordsLabel?: string;
  /** ISO currency code for the sample amounts (falls back to a plain number). */
  currencyCode?: string;
  /** Sales tax active for the org → sample reads "Tax Invoice" + shows a tax line. */
  salesTaxActive?: boolean;
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
    headerLines: input.headerLines,
    metaFields: input.metaFields,
    showDocTitle: input.showDocTitle,
    showAmountInWords: input.showAmountInWords,
    amountInWordsLabel: input.amountInWordsLabel,
  };
  const { body, styles } = composeDocument(
    buildSampleInvoiceDoc(
      previewCurrency(input.currencyCode),
      input.salesTaxActive === true,
    ),
    input.paper,
    header,
  );
  return { body, styles };
};
