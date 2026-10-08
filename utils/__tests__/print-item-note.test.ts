// coding-standard: maintained
/**
 * The muted note under an item name — the warranty frozen on a sale line. It
 * prints on every paper, escaped, and an item without one keeps the plain cell.
 */
import { describe, expect, it } from "vitest";
import { buildItemTable } from "../print-blocks";
import { renderStorefrontOrderInvoice } from "../print-storefront-order";

const tr = (_key: string, fallback: string) => fallback;
const item = { name: "Blender", quantity: 1, price: "1,000", amount: "1,000" };

describe("print item note", () => {
  it("prints the note under the name on A4 and thermal", () => {
    for (const paper of ["a4", "thermal80", "thermal58"] as const) {
      const { rows } = buildItemTable(
        { items: [{ ...item, note: "12-month replacement warranty, until 03 Oct 2027" }] },
        undefined,
        paper,
        tr,
      );
      expect(rows[0][0]).toEqual({
        html: 'Blender<div class="muted item-note">12-month replacement warranty, until 03 Oct 2027</div>',
      });
    }
  });

  it("escapes the note and leaves an item without one as plain text", () => {
    const { rows } = buildItemTable(
      { items: [{ ...item, note: "<b>x</b>" }, item] },
      undefined,
      "a4",
      tr,
    );
    expect((rows[0][0] as { html: string }).html).toContain("&lt;b&gt;x&lt;/b&gt;");
    expect(rows[1][0]).toBe("Blender");
  });

  it("prints a multi-line note (warranty, then serials) one line each", () => {
    const { rows } = buildItemTable(
      { items: [{ ...item, note: "12-month warranty\nS/N: A1, B2" }] },
      undefined,
      "thermal58",
      tr,
    );
    expect((rows[0][0] as { html: string }).html).toContain("12-month warranty<br>S/N: A1, B2");
  });

  it("prints an online order's warranty and serials under the item, escaped", () => {
    const order = {
      orderNumber: "ORD-20261008-00002",
      createdAt: "2026-10-08T09:47:00.000Z",
      status: "shipped",
      paymentMethod: "cod",
      paymentStatus: "pending",
      items: [
        { productName: "B", price: 180, quantity: 1, subtotal: 180, note: "12-month replacement warranty\nS/N: <SN-1>" },
        { productName: "Cap", price: 60, quantity: 1, subtotal: 60 },
      ],
      subtotal: 240,
      totalAmount: 240,
      shippingAddress: { name: "Md Rashidul Karim" },
    };
    const { body } = renderStorefrontOrderInvoice(order, {
      header: {},
      currency: (n) => String(n),
      formatDate: (iso) => iso,
    });
    expect(body).toContain('B<div class="muted item-note">12-month replacement warranty<br>S/N: &lt;SN-1&gt;</div>');
    expect(body).not.toContain('Cap<div class="muted item-note">');
  });
});
