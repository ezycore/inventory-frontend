import { describe, it, expect } from "vitest";
import { renderReceiptPreview } from "@/utils/print-documents";
import type { ReceiptHeaderLine } from "@/types/receipt";

/** Render the sample-invoice preview body for a set of receipt options. */
const body = (input: Parameters<typeof renderReceiptPreview>[0]) =>
  renderReceiptPreview(input).body;

describe("renderReceiptPreview — letterhead", () => {
  const base = {
    paper: "a4" as const,
    orgName: "Acme Traders",
    logoUrl: "https://cdn.test/logo.png",
    address: "12 Market Rd",
    phone: "017-000",
    email: "a@b.com",
    taxId: "BIN-123",
  };

  it("keeps the classic layout when no builder fields are set", () => {
    const html = body(base);
    // Identity block in the legacy order, top logo, default in-words caption.
    expect(html).toContain('<div class="org">Acme Traders</div>');
    expect(html).toContain("VAT Reg. No (BIN): BIN-123");
    expect(html).toContain("12 Market Rd");
    expect(html).toContain("017-000 · a@b.com");
    expect(html).toContain('<img class="logo"');
    expect(html).not.toContain('class="watermark"');
    expect(html).toContain("In words:");
  });

  it("renders a faded watermark (not a top logo) on A4", () => {
    const html = body({ ...base, logoPlacement: "watermark", watermarkOpacity: 0.1 });
    expect(html).toContain('class="watermark"');
    expect(html).toContain("opacity:0.1");
    expect(html).not.toContain('<img class="logo"');
  });

  it("drops the watermark on thermal (1-bit can't render it)", () => {
    const html = body({ ...base, paper: "thermal80", logoPlacement: "watermark" });
    expect(html).not.toContain('class="watermark"');
    expect(html).not.toContain('<img class="logo"');
  });

  it("shows both a watermark and a top logo for placement=both on A4", () => {
    const html = body({ ...base, logoPlacement: "both" });
    expect(html).toContain('class="watermark"');
    expect(html).toContain('<img class="logo"');
  });

  it("clamps watermark opacity into 0.03–0.20", () => {
    expect(body({ ...base, logoPlacement: "watermark", watermarkOpacity: 5 })).toContain(
      "opacity:0.2",
    );
    expect(body({ ...base, logoPlacement: "watermark", watermarkOpacity: 0 })).toContain(
      "opacity:0.03",
    );
  });

  it("hides a meta row switched off via metaFields (keyless Date stays)", () => {
    const html = body({ ...base, metaFields: { status: false } });
    expect(html).not.toContain("Status:");
    expect(html).toContain("Customer:");
    expect(html).toContain("Date:");
  });

  it("honours a custom header line and reordering", () => {
    const headerLines: ReceiptHeaderLine[] = [
      { id: "1", source: "custom", label: "Trade Licence", text: "TL-99", visible: true },
      { id: "2", source: "orgName", visible: false },
      { id: "3", source: "contact", visible: true },
    ];
    const html = body({ ...base, headerLines });
    expect(html).toContain("Trade Licence: TL-99");
    // orgName hidden → no org line
    expect(html).not.toContain('<div class="org">');
    // custom line precedes the contact line
    expect(html.indexOf("Trade Licence")).toBeLessThan(html.indexOf("017-000"));
  });

  it("prints the VAT label over a saved legacy 'Tax Reg. No' seed, but keeps a merchant label", () => {
    const legacy = body({
      ...base,
      headerLines: [{ id: "1", source: "taxId", label: "Tax Reg. No", visible: true }],
    });
    expect(legacy).toContain("VAT Reg. No (BIN): BIN-123");
    expect(legacy).not.toContain("Tax Reg. No");
    const custom = body({
      ...base,
      headerLines: [{ id: "1", source: "taxId", label: "BIN", visible: true }],
    });
    expect(custom).toContain("BIN: BIN-123");
  });

  it("suppresses amount-in-words when toggled off, and uses a custom caption", () => {
    expect(body({ ...base, showAmountInWords: false })).not.toContain("In words");
    expect(body({ ...base, amountInWordsLabel: "Total in words:" })).toContain(
      "Total in words:",
    );
  });

  it("hides the document title when toggled off (number line stays)", () => {
    expect(body(base)).toContain('class="doc-title"'); // default on
    const html = body({ ...base, showDocTitle: false });
    expect(html).not.toContain('class="doc-title"');
    expect(html).not.toContain("Tax Invoice");
    expect(html).toContain("#"); // the number line still prints
  });

  it("uses a tax-aware sample title + tax line", () => {
    // Tax inactive → plain "Invoice", no tax line.
    expect(body(base)).toContain(">Invoice<");
    expect(body(base)).not.toContain("Tax Invoice");
    expect(body(base)).not.toContain("Tax 5%");
    // Tax active → "Tax Invoice" with the tax line.
    const taxed = body({ ...base, salesTaxActive: true });
    expect(taxed).toContain("Tax Invoice");
    expect(taxed).toContain("Tax 5%");
  });

  it("keeps the paper's CSS logo size when no box is set (no inline style)", () => {
    expect(body(base)).toContain('<img class="logo" src="https://cdn.test/logo.png" alt="" />');
  });

  it("sizes the top logo from the box for the rendered paper only", () => {
    const logoSize = { a4: { heightMm: 25, widthMm: 80 }, thermal58: { heightMm: 9, widthMm: 40 } };
    expect(body({ ...base, logoSize })).toContain('style="max-height:25mm;max-width:80mm"');
    expect(body({ ...base, paper: "thermal58", logoSize })).toContain(
      'style="max-height:9mm;max-width:40mm"',
    );
    // 80 mm has no box → its CSS size stays.
    expect(body({ ...base, paper: "thermal80", logoSize })).not.toContain("max-height:");
  });

  it("sizes and anchors the watermark only when set", () => {
    const plain = body({ ...base, logoPlacement: "watermark" });
    expect(plain).toContain('style="opacity:0.08"');
    const sized = body({
      ...base,
      logoPlacement: "watermark",
      watermarkSize: { widthPct: 80, heightPct: 40 },
      watermarkPosition: "bottom",
    });
    expect(sized).toContain("max-width:80%;max-height:40%");
    expect(sized).toContain("bottom:6%");
    expect(body({ ...base, logoPlacement: "watermark", watermarkPosition: "top" })).toContain(
      "top:6%",
    );
  });

  it("labels the buyer's number as the customer phone", () => {
    expect(body(base)).toContain("Customer phone:");
  });
});

describe("renderReceiptPreview — print setup v2", () => {
  const base = { paper: "a4" as const, orgName: "Acme" };
  const html = (v2: Parameters<typeof renderReceiptPreview>[0]["v2"], extra = {}) =>
    renderReceiptPreview({ ...base, ...extra, v2 }).body;

  it("adds serial / code / unit / discount / VAT columns on A4", () => {
    const out = html({ itemColumns: { serial: true, code: true, unit: true, discount: true, vat: "both" } }, { salesTaxActive: true });
    for (const h of [">#<", ">Code<", ">Disc.<", ">VAT %<", ">VAT<"]) expect(out).toContain(h);
    expect(out).toContain("2 pcs");
    expect(out).toContain("8901234567890");
    expect(out).toContain(">5%<");
  });

  it("moves the code under the name on thermal and drops discount + VAT on 58mm", () => {
    const cols = { code: true, discount: true, vat: "both" as const };
    const t80 = html({ itemColumns: cols }, { paper: "thermal80", salesTaxActive: true });
    expect(t80).toContain('class="muted item-code"');
    expect(t80).not.toContain(">Code<");
    expect(t80).toContain(">VAT %<");
    expect(t80).not.toContain(">VAT<"); // amount is A4-only
    const t58 = html({ itemColumns: cols }, { paper: "thermal58", salesTaxActive: true });
    expect(t58).not.toContain(">Disc.<");
    expect(t58).not.toContain("VAT %");
  });

  it("hides Due, inserts payment rows after Paid, appends previous balance", () => {
    const out = html({ totals: { showPaymentMethods: true, showPreviousBalance: true } });
    expect(out.indexOf(">Paid<")).toBeLessThan(out.indexOf(">Cash<"));
    expect(out).toContain(">bKash<");
    expect(out).toContain("Previous due");
    expect(out).toContain("Total due");
  });

  it("shows cash received / change on thermal by default, not on A4", () => {
    expect(html({}, { paper: "thermal80" })).toContain("Cash received");
    expect(html({})).not.toContain("Cash received");
    expect(html({ totals: { showTenderedChange: true } })).toContain("Change");
  });

  it("renders two signature lines with images, and none when disabled", () => {
    const out = html({
      signature: { leftLabel: "Customer Signature", imageHeightMm: 20 },
      signatureImageUrl: "https://cdn.test/sig.png",
      stampImageUrl: "https://cdn.test/stamp.png",
    });
    expect(out).toContain('class="signature two"');
    expect(out).toContain("Customer Signature");
    expect(out).toContain('class="stamp-img"');
    expect(out).toContain("height:20mm");
    expect(html({ signature: { enabled: false } })).not.toContain("signature-line");
  });

  it("prints banks + wallets on A4 and wallets only on thermal", () => {
    const paymentDetails = [
      { id: "1", kind: "bank" as const, visible: true, bankName: "DBBL", accountNumber: "123" },
      { id: "2", kind: "wallet" as const, visible: true, provider: "bkash" as const, accountType: "merchant" as const, number: "01711" },
      { id: "3", kind: "wallet" as const, visible: false, provider: "nagad" as const, number: "01811" },
    ];
    const a4 = html({ paymentDetails });
    expect(a4).toContain("DBBL");
    expect(a4).toContain("bKash (Merchant): 01711");
    expect(a4).not.toContain("01811");
    const t = html({ paymentDetails }, { paper: "thermal80" });
    expect(t).not.toContain("DBBL");
    expect(t).toContain("01711");
  });

  it("prints terms on A4 only and a QR as inline SVG", () => {
    expect(html({ terms: "No refunds" })).toContain('class="terms">No refunds');
    expect(html({ terms: "No refunds" }, { paper: "thermal80" })).not.toContain("No refunds");
    const qr = html({ qrValue: "https://shop.test", qrLabel: "Shop online", qrSizeMm: 30 });
    expect(qr).toContain('class="sign-row"');
    expect(qr).toContain('width="30mm"');
    expect(qr).toContain("Shop online");
  });

  it("applies per-document overrides: title, null footer, hidden QR", () => {
    const out = html(
      {
        qrValue: "https://shop.test",
        documents: { invoice: { title: "Cash Memo", footer: null, showQr: false } },
      },
      { footer: "Thanks" },
    );
    expect(out).toContain(">Cash Memo<");
    expect(out).not.toContain("Thanks");
    expect(out).not.toContain("qr-svg");
  });

  it("keeps payment details and QR off purchase orders by default", () => {
    const out = html(
      { qrValue: "https://shop.test", paymentDetails: [{ id: "1", kind: "wallet", visible: true, number: "017" }] },
      { docKind: "purchaseOrder" },
    );
    expect(out).toContain("Purchase Order");
    expect(out).not.toContain("qr-svg");
    expect(out).not.toContain("Payment details");
  });

  it("stamps copy labels and a cut line when copies > 1", () => {
    const out = renderReceiptPreview({
      ...base,
      paper: "thermal80",
      showCopies: true,
      v2: { copies: 2, copyLabels: ["", "Shop"] },
    }).body;
    expect(out).toContain(">Customer Copy<");
    expect(out).toContain(">Shop<");
    expect(out).toContain('class="cut-line"');
  });

  it("scales thermal text and margins only when set", () => {
    const styles = (thermal: object) =>
      renderReceiptPreview({ ...base, paper: "thermal80", v2: { thermal } }).styles;
    expect(styles({})).toBe(renderReceiptPreview({ ...base, paper: "thermal80" }).styles);
    expect(styles({ fontScale: "lg", sideMarginMm: 1 })).toContain("font-size: 12.7px");
    expect(styles({ sideMarginMm: 1 })).toContain("padding-left: 1mm");
  });
});

describe("renderReceiptPreview — A5 page paper", () => {
  const base = { paper: "a5" as const, orgName: "Acme", logoUrl: "https://cdn.test/logo.png" };
  const html = (v2: Parameters<typeof renderReceiptPreview>[0]["v2"], extra = {}) =>
    renderReceiptPreview({ ...base, ...extra, v2 }).body;

  it("prints on an A5 page, not a thermal roll", () => {
    const { styles } = renderReceiptPreview(base);
    expect(styles).toContain("@page { size: A5;");
    expect(styles).not.toContain("size: A4");
    expect(styles).not.toContain("80mm");
  });

  it("keeps the full-page blocks A4 has: watermark, signature, banks, terms, VAT amount", () => {
    expect(body({ ...base, logoPlacement: "watermark" })).toContain('class="watermark"');
    const out = html(
      {
        itemColumns: { code: true, vat: "both" },
        signature: { leftLabel: "Customer Signature" },
        paymentDetails: [
          { id: "1", kind: "bank", visible: true, bankName: "DBBL", accountNumber: "123" },
        ],
        terms: "No refunds",
      },
      { salesTaxActive: true },
    );
    expect(out).toContain(">Code<");
    expect(out).toContain(">VAT<");
    expect(out).toContain('class="signature two"');
    expect(out).toContain("DBBL");
    expect(out).toContain('class="terms">No refunds');
    expect(out).not.toContain("Cash received");
  });

  it("caps the QR at 32 mm and separates copies with a page break", () => {
    expect(html({ qrValue: "https://shop.test", qrSizeMm: 40 })).toContain('width="32mm"');
    const copies = renderReceiptPreview({ ...base, showCopies: true, v2: { copies: 2 } }).body;
    expect(copies).toContain("copy-break");
    expect(copies).not.toContain('class="cut-line"');
  });

  it("applies the A5 logo box only to A5", () => {
    const logoSize = { a5: { heightMm: 12, widthMm: 40 } };
    expect(body({ ...base, logoSize })).toContain("max-height:12mm;max-width:40mm");
    expect(body({ ...base, paper: "a4", logoSize })).not.toContain("max-height:12mm");
  });
});
