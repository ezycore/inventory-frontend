// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PayoutDetailSheet } from "./payout-detail-sheet";
import type { CourierPayout } from "@/services/api";

/**
 * The detail sheet reads a statement against reality, so the awkward shapes are the point.
 *
 * Two of them look like errors and are not:
 *
 * - a line with **no matching order** — merchants ship from the courier's own panel too, and
 *   the backend records such a line rather than rejecting the whole payout;
 * - a **return leg** collecting nothing while still carrying its delivery fee — an RTO costs
 *   money and brings none in.
 *
 * And two figures must stay visible rather than be absorbed: `residual` (the courier is still
 * holding money these parcels were waiting on) and `unrecordedGross` (they paid for parcels
 * that never passed through a clearing account). Both are the server's answers.
 */
vi.mock("@/services/stores/use-auth-store", () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { organization: { currency: "BDT" } } }),
}));

const detail = vi.hoisted(() => ({ current: undefined as unknown }));

vi.mock("@/services/api", () => ({
  useCourierPayout: () => ({ data: detail.current, isLoading: false }),
}));

vi.mock("./payout-post-dialog", () => ({
  PayoutPostDialog: () => <button>Confirm &amp; post</button>,
}));

const payout = {
  _id: "payout-1",
  statementRef: "SFC-26926554",
  provider: "steadfast",
  paymentMode: "Bkash",
  receivedAt: "2026-09-10T00:00:00.000Z",
  gross: 550,
  deductions: {
    delivery: 65,
    codFee: 0,
    paymentCharge: 5,
    returnCharge: 0,
    adjustment: 0,
  },
  net: 480,
  status: "pending",
  reconciled: false,
  residual: 20,
  unrecordedGross: 120,
  lines: [
    {
      orderId: "order-1",
      orderNumber: "ORD-20260906-00001",
      consignmentRef: "CID-1",
      legType: "forward",
      collected: 570,
      deliveryFee: 150,
      codFee: 36.35,
    },
    {
      orderNumber: undefined,
      consignmentRef: "PANEL-ONLY",
      legType: "forward",
      collected: 0,
    },
    {
      orderId: "order-2",
      orderNumber: "ORD-20260906-00002",
      consignmentRef: "CID-2",
      legType: "return",
      collected: 0,
      deliveryFee: 65,
    },
  ],
} as unknown as CourierPayout;

describe("PayoutDetailSheet", () => {
  it("renders an unmatched line and a return leg as ordinary facts", () => {
    detail.current = payout;
    render(<PayoutDetailSheet payoutId="payout-1" onClose={() => {}} />);

    expect(screen.getByText(/not one of ours/i)).toBeInTheDocument();
    expect(screen.getByText(/courier's own panel/i)).toBeInTheDocument();
    expect(screen.getByText("Return")).toBeInTheDocument();
    expect(screen.getByText("ORD-20260906-00001")).toBeInTheDocument();
  });

  it("shows the residual and the unrecorded gross, with what each means", () => {
    detail.current = payout;
    render(<PayoutDetailSheet payoutId="payout-1" onClose={() => {}} />);

    expect(screen.getByText(/still sitting with this courier/i)).toBeInTheDocument();
    expect(screen.getByText(/never passed through a clearing account/i)).toBeInTheDocument();
    expect(screen.getByText("Unreconciled")).toBeInTheDocument();
  });

  it("drops deduction lines the courier did not charge", () => {
    detail.current = payout;
    render(<PayoutDetailSheet payoutId="payout-1" onClose={() => {}} />);

    expect(screen.getByText("Delivery")).toBeInTheDocument();
    expect(screen.getByText("Payment charge")).toBeInTheDocument();
    expect(screen.queryByText("Return charge")).not.toBeInTheDocument();
  });
});
