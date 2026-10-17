// coding-standard: maintained
import { describe, expect, it } from "vitest";

import { useAuthStore } from "@/services/stores/use-auth-store";
import type { DashboardOverview } from "@/services/api";
import { renderWithProviders, screen } from "@/tests/test-utils";
import type { OrganizationFeatures } from "@/types";
import type { DashboardBlockContext } from "./context";
import { ReceivablesCard } from "./stat-cards";

/**
 * The Receivable card is the way into "who owes me?" — there is no dues page,
 * so it opens the customers list filtered to debtors. It only links for a user
 * who may open that list; for anyone else it stays a plain figure.
 */
const signIn = (permissions: string[]) =>
  useAuthStore.setState({
    user: {
      id: "user-1",
      email: "owner@example.com",
      role: "owner",
      permissions,
      organization: {
        name: "Test Org",
        slug: "test-org",
        features: { accounts: true } as OrganizationFeatures,
      },
    },
    token: "test-token",
    isAuthenticated: true,
  });

const context = {
  blocks: ["receivables"],
  overview: { outstanding: { receivable: 4200 } } as DashboardOverview,
  isLoading: false,
  formatCurrency: (value: number) => `৳${value}`,
  movementsLoading: false,
} as unknown as DashboardBlockContext;

describe("ReceivablesCard", () => {
  it("opens the customers who owe money", () => {
    signIn(["customers.view"]);
    renderWithProviders(<ReceivablesCard {...context} />);
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/customers?hasDues=true",
    );
    expect(screen.getByText("৳4200")).toBeInTheDocument();
  });

  it("is a plain figure for a user who cannot open the customers list", () => {
    signIn([]);
    renderWithProviders(<ReceivablesCard {...context} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("৳4200")).toBeInTheDocument();
  });
});
