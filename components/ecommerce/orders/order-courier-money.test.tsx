// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OrderCourierMoney } from "./order-courier-money";
import type { AdminStorefrontOrder } from "@/services/api";

/**
 * The order page's courier-money panel.
 *
 * It exists because the page could show neither of the two things that made COD margin a
 * fiction: the delivery cost was the dispatch quote (no COD fee in it at all), and collected
 * cash was booked as cash days before the courier handed it over.
 *
 * Three rules it must hold to:
 *
 * - **`supported: false` is an answer.** Steadfast publishes no charge anywhere, so a parcel
 *   with no actual figure says the quote still stands — it never shows an invented number.
 * - **Absent is not zero.** A courier that itemises no COD fee has not said it was free, so
 *   the row is dropped rather than printed as 0.
 * - **`not_collected` says nothing.** The payment panel already covers an uncollected order.
 */
vi.mock("@/services/stores/use-auth-store", () => {
  const state = { user: { organization: { currency: "BDT", timezone: "Asia/Dhaka" } } };
  // A selector hook that also answers `getState()`, which `getOrgTimezone` reads.
  const useAuthStore = (selector: (s: unknown) => unknown) => selector(state);
  return { useAuthStore: Object.assign(useAuthStore, { getState: () => state }) };
});

vi.mock("@/hooks/use-has-permission", () => ({
  useHasPermission: () => true,
  PERMISSIONS: {},
}));

const refresh = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }));

vi.mock("@/services/api", () => ({
  useRefreshCourierCharges: () => refresh,
}));

const order = (courier: Record<string, unknown>) =>
  ({ _id: "order-1", courier }) as unknown as AdminStorefrontOrder;

describe("OrderCourierMoney", () => {
  it("shows the courier's real bill against the quote, and the gap", () => {
    render(
      <OrderCourierMoney
        order={order({
          provider: "pathao",
          integration: "api",
          charges: {
            quoted: 70,
            actual: { deliveryFee: 150, codFee: 36.35, totalFee: 186.35, weightKg: 6 },
            source: "api",
          },
        })}
      />,
    );
    expect(screen.getByText("Quoted at dispatch")).toBeInTheDocument();
    expect(screen.getByText("৳186.35")).toBeInTheDocument();
    expect(screen.getByText("COD fee")).toBeInTheDocument();
    // The live case: ৳116.35 more than quoted, which is the whole margin story.
    expect(screen.getByText(/৳116.35 more than quoted/)).toBeInTheDocument();
  });

  it("says the quote stands when the courier publishes no charge", () => {
    render(
      <OrderCourierMoney
        order={order({
          provider: "steadfast",
          integration: "api",
          charges: { quoted: 60, source: "quote" },
        })}
      />,
    );
    expect(
      screen.getByText(/has not published a charge for this parcel/i),
    ).toBeInTheDocument();
    // No invented total, and no zero pretending to be one.
    expect(screen.queryByText("Actually billed")).not.toBeInTheDocument();
    expect(screen.queryByText("COD fee")).not.toBeInTheDocument();
  });

  it("says where the money is while the courier still holds it", () => {
    render(
      <OrderCourierMoney
        order={order({
          provider: "steadfast",
          integration: "api",
          remittance: { status: "with_courier", clearingAmount: 570 },
        })}
      />,
    );
    expect(screen.getByText(/is with Steadfast/)).toBeInTheDocument();
    expect(screen.getByText("৳570")).toBeInTheDocument();
  });

  it("names the payout once the money has arrived", () => {
    render(
      <OrderCourierMoney
        order={order({
          provider: "steadfast",
          integration: "api",
          remittance: {
            status: "remitted",
            payoutRef: "SFC-26926554",
            remittedAt: "2026-09-10T00:00:00.000Z",
          },
        })}
      />,
    );
    expect(screen.getByText(/SFC-26926554/)).toBeInTheDocument();
  });

  it("renders nothing for a parcel with no courier money at all", () => {
    const { container } = render(
      <OrderCourierMoney
        order={order({ provider: "steadfast", integration: "api" })}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("says nothing about remittance before anything is collected", () => {
    render(
      <OrderCourierMoney
        order={order({
          provider: "steadfast",
          integration: "api",
          charges: { quoted: 60, source: "quote" },
          remittance: { status: "not_collected" },
        })}
      />,
    );
    expect(screen.queryByText(/is with Steadfast/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Remitted/)).not.toBeInTheDocument();
  });
});
