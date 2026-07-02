// coding-standard: maintained
import type { PurchaseOrder, Sale } from "@/types";
import { escapeHtml, printHtml } from "./print";

/**
 * POS document printing (invoice / receipt / purchase order) on top of the
 * shared `printHtml`. A generic doc model + renderer is fed by per-entity
 * adapters, so Sale and PurchaseOrder share one layout across three paper
 * sizes: A4 and thermal 80mm / 58mm.
 */

export type PaperSize = "a4" | "thermal80" | "thermal58";

interface PrintDocColumn {
  header: string;
  align?: "left" | "right";
}

interface PrintDoc {
  docTitle: string;
  number: string;
  meta: { label: string; value: string }[];
  columns: PrintDocColumn[];
  /** Pre-formatted cells (currency already applied by the adapter). */
  rows: (string | number)[][];
  totals: { label: string; value: string; strong?: boolean }[];
  notes?: string;
}

interface DocHeader {
  orgName?: string;
  storeName?: string;
}

const BASE_STYLES = `
  body { font-family: Arial, Helvetica, sans-serif; color: #000; }
  .doc-title { font-weight: 700; text-transform: uppercase; }
  .muted { color: #444; }
  .header { margin-bottom: 4px; }
  table.items { width: 100%; border-collapse: collapse; margin-top: 4px; }
  table.items th, table.items td { text-align: left; padding: 2px 0; vertical-align: top; }
  .num { text-align: right; white-space: nowrap; }
  table.totals { width: 100%; margin-top: 8px; }
  table.totals td { padding: 1px 0; }
  .t-val { text-align: right; }
  .strong { font-weight: 700; }
  .hr { border-top: 1px dashed #000; margin: 6px 0; }
`;

const PAPER_STYLES: Record<PaperSize, string> = {
  a4: `
    @page { size: A4; margin: 14mm; }
    body { font-size: 12px; }
    .doc { max-width: 760px; margin: 0 auto; }
    .org { font-size: 20px; font-weight: 700; }
    table.items th, table.items td { border-bottom: 1px solid #eee; }
  `,
  thermal80: `
    @page { size: 80mm auto; margin: 3mm; }
    body { font-size: 11px; width: 74mm; }
    .org { font-size: 14px; font-weight: 700; }
    .header { text-align: center; }
  `,
  thermal58: `
    @page { size: 58mm auto; margin: 2mm; }
    body { font-size: 10px; width: 54mm; }
    .org { font-size: 12px; font-weight: 700; }
    .header { text-align: center; }
  `,
};

/** Render a generic PrintDoc to a print window at the chosen paper size. */
const printDoc = (doc: PrintDoc, paper: PaperSize, header: DocHeader): boolean => {
  const head = `
    <div class="header">
      ${header.orgName ? `<div class="org">${escapeHtml(header.orgName)}</div>` : ""}
      ${header.storeName ? `<div class="muted">${escapeHtml(header.storeName)}</div>` : ""}
      <div class="doc-title">${escapeHtml(doc.docTitle)}</div>
      <div class="muted">#${escapeHtml(doc.number)}</div>
    </div>
    ${doc.meta
      .map((m) => `<div>${escapeHtml(m.label)}: <b>${escapeHtml(m.value)}</b></div>`)
      .join("")}
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

  const notes = doc.notes
    ? `<div class="hr"></div><div class="muted">${escapeHtml(doc.notes)}</div>`
    : "";

  const body = `<div class="doc">${head}<div class="hr"></div><table class="items">${thead}${tbody}</table>${totals}${notes}</div>`;

  return printHtml(body, {
    title: `${doc.docTitle} ${doc.number}`,
    styles: BASE_STYLES + PAPER_STYLES[paper],
  });
};

const dateStr = (value?: string | Date): string =>
  value ? new Date(value).toLocaleString() : "";

type Currency = (n: number) => string;

const saleToDoc = (sale: Sale, currency: Currency): PrintDoc => {
  const totals: PrintDoc["totals"] = [
    { label: "Subtotal", value: currency(sale.subtotal) },
  ];
  if (sale.additionalDiscount > 0) {
    totals.push({ label: "Discount", value: `- ${currency(sale.additionalDiscount)}` });
  }
  if (sale.taxTotal && sale.taxTotal > 0) {
    totals.push({ label: "Tax", value: currency(sale.taxTotal) });
  }
  totals.push({ label: "Total", value: currency(sale.totalAmount), strong: true });
  totals.push({ label: "Paid", value: currency(sale.paidAmount) });
  if (sale.dueAmount > 0) {
    totals.push({ label: "Due", value: currency(sale.dueAmount), strong: true });
  }

  return {
    docTitle: "Invoice",
    number: sale.invoiceNumber,
    meta: [
      { label: "Date", value: dateStr(sale.createdAt) },
      { label: "Customer", value: sale.customerId?.name ?? "Walk-in Customer" },
      { label: "Status", value: sale.status },
      ...(sale.createdBy
        ? [{ label: "Cashier", value: `${sale.createdBy.firstName} ${sale.createdBy.lastName}` }]
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
    notes: sale.notes,
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
      { label: "Status", value: order.status },
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

interface PrintEntityOptions {
  paper: PaperSize;
  currency: Currency;
  orgName?: string;
  storeName?: string;
}

/** Print a sale as an invoice (A4) or receipt (thermal). Returns false if popup blocked. */
export const printSaleInvoice = (sale: Sale, opts: PrintEntityOptions): boolean =>
  printDoc(saleToDoc(sale, opts.currency), opts.paper, {
    orgName: opts.orgName,
    storeName: opts.storeName,
  });

/** Print a purchase order. Returns false if popup blocked. */
export const printPurchaseOrder = (
  order: PurchaseOrder,
  opts: PrintEntityOptions,
): boolean =>
  printDoc(purchaseOrderToDoc(order, opts.currency), opts.paper, {
    orgName: opts.orgName,
    storeName: opts.storeName,
  });
