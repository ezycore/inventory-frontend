// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReturnDetailsSheet, type ReturnDetailsData } from "./return-details-sheet";

/**
 * G7 (backend `docs/features/business-modes.md`): the return detail of an ONLINE order.
 *
 * It read "Total refund −৳450" on a refused COD parcel where nobody was paid anything, said
 * nothing about the delivery charge the merchant kept or the courier's return charge, and printed
 * "Cost ৳0.00" for a product that never had a cost entered.
 */
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${Object.values(values).join(" ")}` : key,
  useLocale: () => "en",
}));
vi.mock("@/hooks/use-has-permission", () => ({
  PERMISSIONS: { costsView: "costs.view" },
  useHasPermission: () => true,
}));
vi.mock("@/hooks/use-org-calendar", () => ({ getOrgTimezone: () => "Asia/Dhaka" }));
vi.mock("@/services/stores", () => ({
  useAuthStore: () => ({ user: { organization: {} } }),
}));
vi.mock("@/components/shared/print/print-menu", () => ({ PrintMenu: () => null }));

const base: ReturnDetailsData = {
  returnNumber: "RET-20261008-00005",
  status: "completed",
  documentRef: "INV-20261007-00004",
  counterpartyName: "Rahim",
  date: "2026-10-08T14:44:29.893Z",
  reason: "other",
  totalRefundAmount: 450,
  refundedAmount: 0,
  totalCostAmount: 0,
  items: [
    {
      productId: "p1",
      productName: "Floor Mat - Money Dog",
      quantity: 1,
      price: 450,
      costPrice: 0,
      refundAmount: 450,
    },
  ],
};

const renderSheet = (data: ReturnDetailsData) =>
  render(
    <ReturnDetailsSheet
      open
      onOpenChange={() => {}}
      returnData={data}
      formatCurrency={(n) => `৳${n}`}
      variant="sales"
    />,
  );

describe("return detail of an online order (G7)", () => {
  it("separates the sale reversed from the money refunded, and shows what was paid at the door", () => {
    renderSheet({
      ...base,
      online: { orderNumber: "ORD-20261006-00014", collectedAtDoor: 120, returnCharge: null },
    });

    expect(screen.queryByText("totalRefundLabel")).toBeNull();
    // The tile and the line column both say "Sale reversed" — no "Refund" header, no red minus.
    expect(screen.getAllByText("saleReversedLabel")).toHaveLength(2);
    expect(screen.queryByText("refund")).toBeNull();
    expect(screen.queryByText("-৳450")).toBeNull();
    expect(screen.getByText("refundedLabel")).toBeInTheDocument();
    expect(screen.getByText("৳0")).toBeInTheDocument();
    expect(screen.getByText("paidAtDoorLabel")).toBeInTheDocument();
    expect(screen.getByText("৳120")).toBeInTheDocument();
    // Not recorded is not ৳0 — the row stays out.
    expect(screen.queryByText("courierReturnChargeLabel")).toBeNull();
    expect(screen.getByText("ORD-20261006-00014")).toBeInTheDocument();
  });

  it("shows the courier's return charge when one was recorded", () => {
    renderSheet({
      ...base,
      online: { orderNumber: "ORD-1", collectedAtDoor: 120, returnCharge: 60 },
    });
    expect(screen.getByText("courierReturnChargeLabel")).toBeInTheDocument();
    expect(screen.getByText("-৳60")).toBeInTheDocument();
  });

  // A parcel refused with nothing paid: the courier reported no amount, so no tile — it used to
  // show the delivery FEE as "Delivery kept ৳120" (33 UriiBaba orders).
  it("shows nothing paid at the door when the courier reported nothing", () => {
    renderSheet({
      ...base,
      online: { orderNumber: "ORD-1", collectedAtDoor: null, returnCharge: null },
    });
    expect(screen.queryByText("paidAtDoorLabel")).toBeNull();
  });

  it("prints no cost for a line that never had one", () => {
    renderSheet(base);
    expect(screen.queryByText(/costLine/)).toBeNull();
    expect(screen.queryByText("costAmount")).toBeNull();
  });

  it("keeps a counter return's headline as it was", () => {
    renderSheet({ ...base, items: [{ ...base.items[0], costPrice: 200 }] });
    expect(screen.getByText("totalRefundLabel")).toBeInTheDocument();
    expect(screen.getByText("refund")).toBeInTheDocument();
    expect(screen.getByText("costLine ৳200")).toBeInTheDocument();
  });
});
