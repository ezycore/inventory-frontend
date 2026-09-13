// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ChargeVariance } from "./charge-variance";
import { CodInTransit } from "./cod-in-transit";
import type { CourierMoneySummary } from "@/services/api";

/**
 * The two summary panels that answer questions the order list cannot.
 *
 * `CodInTransit` renders **two independently-derived answers** — what the orders say is
 * unremitted, and what the clearing accounts hold. They should agree; where they do not, the
 * disagreement is the finding, so neither is reconciled into the other and nothing sums them.
 *
 * `ChargeVariance` must keep `withoutActual` visible and out of the averages. A parcel with no
 * courier figure is one we do not know about — treating it as accurate is exactly the mistake
 * that let a dispatch quote stand in for the real bill in the first place.
 */
vi.mock("@/services/stores/use-auth-store", () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { organization: { currency: "BDT" } } }),
}));

const codInTransit = {
  summary: { withCourier: 8500, parcels: 12, courierCount: 2 },
  byCourier: [
    {
      provider: "steadfast",
      label: "Steadfast",
      amount: 5000,
      parcels: 7,
      oldestDays: 9,
      ageing: { "0-2": { amount: 1000, parcels: 2 }, "8-14": { amount: 4000, parcels: 5 } },
    },
    {
      provider: "pathao",
      label: "Pathao",
      amount: 3500,
      parcels: 5,
      oldestDays: 3,
      ageing: { "3-7": { amount: 3500, parcels: 5 } },
    },
  ],
  clearingAccounts: [
    { accountId: "acc-1", name: "Steadfast — COD in transit", locationId: "loc-1", balance: 5000 },
    { accountId: "acc-2", name: "Pathao — COD in transit", locationId: "loc-1", balance: 3200 },
  ],
  ageingBuckets: ["0-2", "3-7", "8-14", "15+"],
} as unknown as CourierMoneySummary["codInTransit"];

const variance = {
  summary: {
    parcels: 10,
    withoutActual: 4,
    quoted: 700,
    actual: 1200,
    variance: 500,
    shippingCharged: 800,
    margin: -400,
  },
  outliers: [
    {
      orderNumber: "ORD-20260906-00001",
      provider: "pathao",
      quoted: 70,
      actual: 186.35,
      variance: 116.35,
      shippingCharged: 70,
      margin: -116.35,
    },
  ],
} as unknown as CourierMoneySummary["variance"];

describe("CodInTransit", () => {
  it("shows the orders' answer and the ledger's answer without merging them", () => {
    render(<CodInTransit data={codInTransit} />);

    // Per-courier, from the parcels…
    expect(screen.getByText("Steadfast")).toBeInTheDocument();
    expect(screen.getByText("Steadfast — COD in transit")).toBeInTheDocument();
    // Steadfast's two answers agree, so the figure appears twice — once per derivation.
    expect(screen.getAllByText("৳5,000")).toHaveLength(2);
    // Pathao's disagree by 300, and BOTH numbers stay on screen. Reconciling them here
    // would hide the only evidence that something is missing on one side. (৳3,500 appears
    // twice — as the courier's holding and again in its single ageing bucket.)
    expect(screen.getAllByText("৳3,500").length).toBeGreaterThan(0);
    expect(screen.getByText("৳3,200")).toBeInTheDocument();
  });

  it("reports how long the oldest collection has been held", () => {
    render(<CodInTransit data={codInTransit} />);
    expect(screen.getByText("9 d")).toBeInTheDocument();
  });

  it("says plainly when no courier is holding anything", () => {
    render(<CodInTransit data={undefined} />);
    expect(screen.getByText(/no courier is holding money/i)).toBeInTheDocument();
  });
});

describe("ChargeVariance", () => {
  it("keeps parcels with no courier figure out of the accuracy claim", () => {
    render(<ChargeVariance data={variance} />);
    expect(screen.getByText(/4 with no courier figure yet/i)).toBeInTheDocument();
    expect(screen.getByText(/not counted as accurate above/i)).toBeInTheDocument();
  });

  it("reports margin against the real bill, negative when it is", () => {
    render(<ChargeVariance data={variance} />);
    expect(screen.getByText("Delivery margin")).toBeInTheDocument();
    expect(screen.getByText("-৳400")).toBeInTheDocument();
    // The live case this whole feature was built on.
    expect(screen.getByText("ORD-20260906-00001")).toBeInTheDocument();
    expect(screen.getByText("৳186.35")).toBeInTheDocument();
  });
});
