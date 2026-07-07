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
    expect(html).toContain("Tax Reg. No: BIN-123");
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
});
