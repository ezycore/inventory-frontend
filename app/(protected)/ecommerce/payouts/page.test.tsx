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
vi.mock("@/hooks/use-has-permission", () => ({ useHasPermission: () => true }));

import CourierPayoutsPage from "./page";

afterEach(() => {
  summaryCalls.length = 0;
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
});

const signIn = () =>
  useAuthStore.setState({
    user: { organization: { features: { accounts: false }, currency: "BDT" } },
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
});
