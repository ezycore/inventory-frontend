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
    expect(screen.getByText("-৳400")).toBeInTheDocument();
    // The live case this whole feature was built on.
    expect(screen.getByText("ORD-20260906-00001")).toBeInTheDocument();
    expect(screen.getByText("৳186.35")).toBeInTheDocument();
  });
});
