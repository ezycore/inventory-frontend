// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ChargeVariance } from "./charge-variance";
import type { CourierMoneySummary } from "@/services/api";

/**
 * The charge-variance panel — a question the order list cannot answer.
 * (What each courier holds is the balance cards now; see `courier-balance-cards.test.tsx`.)
 *
 * `ChargeVariance` must keep `withoutActual` visible and out of the averages. A parcel with no
 * courier figure is one we do not know about — treating it as accurate is exactly the mistake
 * that let a dispatch quote stand in for the real bill in the first place.
 */
vi.mock("@/services/stores/use-auth-store", () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { organization: { currency: "BDT" } } }),
}));

const variance = {
  summary: {
    parcels: 10,
    withoutActual: 4,
    quoted: 700,
    actual: 1200,
    variance: 500,
    shippingCharged: 800,
    shippingReceived: 730,
    returned: 1,
    margin: -470,
  },
  outliers: [
    {
      orderNumber: "ORD-20260906-00001",
      provider: "pathao",
      quoted: 70,
      actual: 186.35,
      variance: 116.35,
      shippingCharged: 70,
      shippingReceived: 70,
      margin: -116.35,
    },
    {
      orderNumber: "ORD-20260930-00016",
      provider: "pathao",
      quoted: 64.85,
      actual: 100,
      variance: 35.15,
      shippingCharged: 70,
      shippingReceived: 0,
      returned: true,
      margin: -100,
    },
  ],
} as unknown as CourierMoneySummary["variance"];

describe("ChargeVariance", () => {
  it("keeps parcels with no courier figure out of the accuracy claim", () => {
    render(<ChargeVariance data={variance} />);
    expect(
      screen.getByText(/4 with no courier figure yet/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/not counted as accurate above/i),
    ).toBeInTheDocument();
  });

  it("reports margin against the real bill, negative when it is", () => {
    render(<ChargeVariance data={variance} />);
    expect(screen.getByText("Delivery margin")).toBeInTheDocument();
    expect(screen.getByText("-৳470")).toBeInTheDocument();
    // The live case this whole feature was built on.
    expect(screen.getByText("ORD-20260906-00001")).toBeInTheDocument();
    expect(screen.getByText("৳186.35")).toBeInTheDocument();
  });

  it("credits a parcel that came back with what the customer paid, not the fee on the order", () => {
    render(<ChargeVariance data={variance} />);
    expect(screen.getByText(/Customers paid ৳730 for delivery of the ৳800 on these orders/)).toBeInTheDocument();
    expect(screen.getByText(/1 parcel came back/)).toBeInTheDocument();
    // Live, UriiBaba ORD-20260930-00016: returned, Pathao billed ৳100, the customer paid nothing.
    const row = screen.getByText("ORD-20260930-00016").closest("tr")!;
    expect(row).toHaveTextContent("৳0(came back)");
    expect(row).toHaveTextContent("-৳100");
    expect(screen.getByText("Biggest losses on delivery")).toBeInTheDocument();
  });

  it("does not blame Steadfast for a missing charge", () => {
    render(<ChargeVariance data={variance} />);
    expect(screen.queryByText(/Steadfast publishes no charge/)).not.toBeInTheDocument();
    expect(screen.getByText(/still waiting for the courier's real charge/)).toBeInTheDocument();
  });
});
