// coding-standard: maintained
/**
 * The printed return of an ONLINE order (G7, backend `docs/features/business-modes.md`). The screen
 * was fixed in 1.4.0, but the printout still read "Total Refund ৳450" on a refused COD parcel where
 * nobody was paid anything. It now prints the same figures as the screen.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const printed = vi.hoisted(() => ({ html: "" }));
vi.mock("@/utils/print", async (orig) => ({
  ...(await orig<typeof import("@/utils/print")>()),
  printHtml: (body: string) => {
    printed.html = body;
    return true;
  },
}));
vi.mock("@/hooks/use-org-calendar", () => ({ getOrgTimezone: () => "Asia/Dhaka" }));

import type { ReturnDetailsData } from "@/components/shared/returns";
import { orgToPrintHeader, printReturn } from "@/utils/print-documents";

const base: ReturnDetailsData = {
  returnNumber: "RET-20261008-00005",
  status: "completed",
  documentRef: "INV-20261007-00004",
  counterpartyName: "Sany",
  date: "2026-10-08T14:44:29.893Z",
  totalRefundAmount: 450,
  refundedAmount: 0,
  totalCostAmount: 0,
  items: [
    { productId: "p1", productName: "Floor Mat", quantity: 1, price: 450, costPrice: 0, refundAmount: 450 },
  ],
};

const print = (data: ReturnDetailsData) =>
  printReturn(data, "sales", {
    paper: "a4",
    currency: (n: number) => `৳${n}`,
    header: orgToPrintHeader({ name: "UriiBaba" }),
  });

beforeEach(() => {
  printed.html = "";
});

describe("printed return of an online order", () => {
  it("prints sale reversed, refunded and paid at the door — not Total Refund", () => {
    print({ ...base, online: { orderNumber: "ORD-20261006-00014", collectedAtDoor: 120, returnCharge: null } });
    expect(printed.html).not.toContain("Total Refund");
    expect(printed.html).not.toContain(">Refund<");
    expect(printed.html).toContain("Sale reversed");
    expect(printed.html).toContain("Refunded");
    expect(printed.html).toContain("Paid at the door");
    expect(printed.html).toContain("৳120");
    expect(printed.html).toContain("ORD-20261006-00014");
    // Not recorded is not ৳0.
    expect(printed.html).not.toContain("Courier return charge");
  });

  it("prints the courier's return charge when one was recorded", () => {
    print({ ...base, online: { orderNumber: "ORD-1", collectedAtDoor: null, returnCharge: 60 } });
    expect(printed.html).toContain("Courier return charge");
    expect(printed.html).toContain("- ৳60");
    expect(printed.html).not.toContain("Paid at the door");
  });

  it("keeps a counter return as it was", () => {
    print(base);
    expect(printed.html).toContain("Total Refund");
    expect(printed.html).not.toContain("Sale reversed");
  });
});
