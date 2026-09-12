// coding-standard: maintained
import {
  composeDocument,
  type DocHeader,
  type PaperSize,
  type PrintDoc,
} from "./print-documents";
import { amountToWords } from "./number-to-words";
import { printHtml } from "./print";

/**
 * Storefront/ecommerce order → letterhead invoice, on the SAME print engine as
 * every other document (Settings → Receipt & Print drives the letterhead). Used
 * by the admin order pages (single + bulk) and the shopper-facing invoice page,
 * so the owner's custom invoice prints identically everywhere.
 */

/** The order fields the invoice renders — satisfied structurally by both the
 * shopper payload (`StorefrontOrder`) and the admin payload (`AdminStorefrontOrder`). */
export interface PrintableStorefrontOrder {
  orderNumber: string;
  createdAt: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  items: { productName: string; price: number; quantity: number; subtotal: number }[];
  subtotal: number;
  discountAmount?: number;
  couponCode?: string;
  shippingCharged?: number;
  totalAmount: number;
  shippingAddress: {
    name: string;
    phone?: string;
    /** Omitted for pickup orders (name + phone only). */
    address?: string;
    area?: string;
    zone?: string;
  };
}

/** Every printed string, so the shopper side can render the document in Bengali. */
export interface OrderInvoiceLabels {
  docTitle: string;
  date: string;
  orderRef: string;
  customer: string;
  phone: string;
  address: string;
  paymentMethod: string;
  status: string;
  cod: string;
  bankTransfer: string;
  customPayment: string;
  item: string;
  qty: string;
  price: string;
  amount: string;
  subtotal: string;
  discount: string;
  shipping: string;
  insideDhaka: string;
  outsideDhaka: string;
  free: string;
  total: string;
  paid: string;
  due: string;
}

export const ORDER_INVOICE_LABELS_EN: OrderInvoiceLabels = {
  docTitle: "Invoice",
  date: "Date",
  orderRef: "Order ref",
  customer: "Customer",
  phone: "Phone",
  address: "Address",
  paymentMethod: "Payment",
  status: "Status",
  cod: "Cash on Delivery",
  bankTransfer: "Bank Transfer",
  customPayment: "Custom payment",
  item: "Item",
  qty: "Qty",
  price: "Price",
  amount: "Amount",
  subtotal: "Subtotal",
  discount: "Discount",
  shipping: "Shipping",
  insideDhaka: "Inside Dhaka",
  outsideDhaka: "Outside Dhaka",
  free: "Free",
  total: "Total",
  paid: "Paid",
  due: "Due",
};

export interface OrderInvoiceOptions {
  /** Letterhead header — build via `orgToPrintHeader` (admin) or the store's
   * public `printable` payload (shopper). */
  header: DocHeader;
  currency: (n: number) => string;
  labels?: OrderInvoiceLabels;
  /** Localized date renderer; default = `toLocaleString()`. */
  formatDate?: (iso: string) => string;
  /** Localized status renderer; default capitalizes the raw status. */
  formatStatus?: (status: string) => string;
  /** The store's current method definitions, for an order with no snapshot. */
  paymentMethods?: { id: string; title: string }[];
  /** The order's frozen wording — wins outright, so a deleted method still prints. */
  paymentMethodTitle?: string;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const orderToDoc = (
  order: PrintableStorefrontOrder,
  opts: OrderInvoiceOptions,
): PrintDoc => {
  const t = opts.labels ?? ORDER_INVOICE_LABELS_EN;
  const currency = opts.currency;
  const addr = order.shippingAddress;
  const discount = order.discountAmount ?? 0;
  const shippingCharged = order.shippingCharged ?? 0;
  const zoneLabel = addr.zone === "outside" ? t.outsideDhaka : t.insideDhaka;
  const paid = order.paymentStatus === "paid";

  const totals: PrintDoc["totals"] = [
    { label: t.subtotal, value: currency(order.subtotal) },
  ];
  if (discount > 0) {
    totals.push({
      label: order.couponCode ? `${t.discount} · ${order.couponCode}` : t.discount,
      value: `- ${currency(discount)}`,
    });
  }
  totals.push({
    label: `${t.shipping} · ${zoneLabel}`,
    value: shippingCharged === 0 ? t.free : currency(shippingCharged),
  });
  totals.push({ label: t.total, value: currency(order.totalAmount), strong: true });
  totals.push(
    paid
      ? { label: t.paid, value: currency(order.totalAmount) }
      : { label: t.due, value: currency(order.totalAmount), strong: true },
  );

  return {
    docTitle: t.docTitle,
    number: `INV-${order.orderNumber.replace(/^ORD-/, "")}`,
    meta: [
      {
        label: t.date,
        value: (opts.formatDate ?? ((iso) => new Date(iso).toLocaleString()))(
          order.createdAt,
        ),
      },
      { label: t.orderRef, value: order.orderNumber },
      { label: t.customer, value: addr.name, key: "customer" },
      ...(addr.phone
        ? [{ label: t.phone, value: addr.phone, key: "phone" as const }]
        : []),
      {
        label: t.address,
        // Pickup orders have no address line — join whatever parts exist.
        value: [addr.address, addr.area].filter(Boolean).join(", "),
        key: "address",
      },
      {
        label: t.paymentMethod,
        value:
          opts.paymentMethodTitle?.trim() ||
          opts.paymentMethods?.find((m) => m.id === order.paymentMethod)?.title?.trim() ||
          (order.paymentMethod === "cod"
            ? t.cod
            : order.paymentMethod === "bank"
              ? t.bankTransfer
              : order.paymentMethod === "manual"
                ? t.customPayment
                : order.paymentMethod),
      },
      {
        label: t.status,
        value: (opts.formatStatus ?? cap)(order.status),
        key: "status",
      },
    ],
    columns: [
      { header: t.item },
      { header: t.qty, align: "right" },
      { header: t.price, align: "right" },
      { header: t.amount, align: "right" },
    ],
    rows: order.items.map((item) => [
      item.productName,
      item.quantity,
      currency(item.price),
      currency(item.subtotal),
    ]),
    totals,
    amountInWords: amountToWords(order.totalAmount),
    signature: true,
  };
};

/** Compose one order invoice for an inline preview iframe (shopper page). */
export const renderStorefrontOrderInvoice = (
  order: PrintableStorefrontOrder,
  opts: OrderInvoiceOptions,
): { body: string; styles: string; title: string } =>
  composeDocument(orderToDoc(order, opts), "a4", opts.header);

/**
 * Print one or many order invoices in one print job, one page per order.
 * Returns false only if the hidden print frame couldn't be created.
 */
export const printStorefrontOrderInvoices = (
  orders: PrintableStorefrontOrder[],
  paper: PaperSize,
  opts: OrderInvoiceOptions,
): boolean => {
  if (orders.length === 0) return true;
  const composed = orders.map((o) =>
    composeDocument(orderToDoc(o, opts), paper, opts.header),
  );
  // The watermark is position:fixed (repeats behind every page) — with many
  // docs in one window the copies would stack and multiply the opacity, so
  // keep only the first document's.
  const bodies = composed.map(({ body }, i) =>
    i === 0 ? body : body.replace(/^<img class="watermark"[^>]*\/>/, ""),
  );
  const html = bodies
    .map((body) => `<div class="inv-page">${body}</div>`)
    .join("");
  const styles = `${composed[0].styles}
    .inv-page { break-after: page; }
    .inv-page:last-child { break-after: auto; }`;
  const title =
    orders.length === 1 ? composed[0].title : `Invoices (${orders.length})`;
  return printHtml(html, { title, styles });
};
