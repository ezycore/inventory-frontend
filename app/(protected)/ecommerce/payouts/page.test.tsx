// coding-standard: maintained
import { afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderWithProviders, screen } from "@/tests/test-utils";
import { useAuthStore } from "@/services/stores/use-auth-store";

/**
 * The courier page follows a period. It opened on all time until 2026-10-11, so its delivery
 * totals only ever grew and "how did delivery do this month?" had no answer.
 */
const summaryCalls: unknown[] = [];

vi.mock("@/services/api", () => ({
  useCourierBalances: () => ({ data: undefined }),
  useCourierMoneySummary: (filters: unknown) => {
    summaryCalls.push(filters);
    return { data: undefined };
  },
}));
// The payouts half has its own tests; here only whether the page shows it.
vi.mock("@/components/ecommerce/payouts/payout-list", () => ({ PayoutList: () => null }));
vi.mock("@/components/ecommerce/payouts/courier-balance-cards", () => ({
  CourierBalanceCards: () => null,
}));
vi.mock("@/hooks/use-has-permission", () => ({ useHasPermission: () => true }));

import CourierPayoutsPage from "./page";

afterEach(() => {
  summaryCalls.length = 0;
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
});

const signIn = (features: Record<string, boolean> = { accounts: false }) =>
  useAuthStore.setState({
    user: { organization: { features, currency: "BDT" } },
    isAuthenticated: true,
  } as never);

describe("Courier charges page", () => {
  it("opens on this month, and All time asks for every parcel", async () => {
    signIn();
    renderWithProviders(<CourierPayoutsPage />);
    expect(summaryCalls.at(-1)).toEqual({ period: "thisMonth" });

    await userEvent.click(screen.getByRole("button", { name: /all time/i }));
    expect(summaryCalls.at(-1)).toEqual({});
  });

  it("follows the Courier payouts switch, not Cash & Bank", () => {
    // Cash & Bank on, payouts off: still only the charges, and the way to turn tracking on.
    signIn({ accounts: true, courierPayouts: false });
    const { unmount } = renderWithProviders(<CourierPayoutsPage />);
    expect(screen.getByRole("heading", { name: "Courier charges" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Customize workspace" })).toHaveAttribute(
      "href",
      "/settings/features",
    );
    unmount();

    // Cash & Bank off, payouts on: the full payouts screen.
    signIn({ accounts: false, courierPayouts: true });
    renderWithProviders(<CourierPayoutsPage />);
    expect(screen.getByRole("heading", { name: "Courier payouts" })).toBeInTheDocument();
  });
});
