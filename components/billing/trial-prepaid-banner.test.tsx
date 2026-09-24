// coding-standard: maintained
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";

import { server } from "@/tests/mocks/server";
import { renderWithProviders, screen } from "@/tests/test-utils";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { BillingOverview } from "./billing-overview";

/**
 * Settings → Billing, for a merchant who paid during their trial.
 *
 * Everything else on the page reads exactly as it does for someone who has NOT
 * paid: the subscription is still `trialing` (that is what preserves the days
 * they paid for), the trial end date is unchanged, and no invoice is
 * outstanding. Without a positive statement the page silently swallows the
 * payment they came to check on — and the "Trialing" badge actively suggests
 * they still owe money.
 *
 * Rendered through `BillingOverview` so the banner's mounting is covered too,
 * not just its internals; an unmounted banner is precisely how this class of
 * thing ships invisible.
 */
const TRIAL_ENDS = "2026-10-08T00:00:00.000Z";

const subscription = (entitlement: Record<string, unknown>) =>
  http.get("*/api/organization/subscription", () =>
    HttpResponse.json({
      success: true,
      data: {
        entitlement: {
          status: "active",
          planSlug: "growth",
          planName: "Growth",
          amount: 599,
          currency: "BDT",
          gateway: "paystation",
          limits: {},
          features: {},
          ...entitlement,
        },
        usage: {
          locations: 1,
          users: 1,
          inventory: 10,
          salesToday: 0,
          purchasesToday: 0,
          storageBytes: 0,
        },
      },
    }),
  );

beforeEach(() =>
  useAuthStore.setState({
    user: {
      id: "user-1",
      email: "owner@example.com",
      role: "owner",
      permissions: ["organization.view", "organization.edit"],
      organization: { name: "Test Org", slug: "test-org", currency: "BDT" },
    },
    token: "test-token",
    isAuthenticated: true,
  }),
);
afterEach(() => useAuthStore.setState({ user: null, isAuthenticated: false }));

describe("a trial that has already been paid for", () => {
  it("says the payment was received and names the amount", async () => {
    server.use(
      subscription({
        subscriptionStatus: "trialing",
        trialEndsAt: TRIAL_ENDS,
        trialPrepaid: true,
      }),
    );
    renderWithProviders(<BillingOverview />);

    expect(await screen.findByText(/payment received/i)).toBeInTheDocument();
    // Scoped to the banner's own sentence — the plan card prints the same
    // amount as a plain "Amount" row, which says nothing about payment.
    expect(await screen.findByText(/still runs until/i)).toHaveTextContent(/599/);
  });

  it("states that the trial still runs to its original end date", async () => {
    server.use(
      subscription({
        subscriptionStatus: "trialing",
        trialEndsAt: TRIAL_ENDS,
        trialPrepaid: true,
      }),
    );
    renderWithProviders(<BillingOverview />);

    // The date is the reassurance: paying early must not have shortened it.
    const body = await screen.findByText(/still runs until/i);
    expect(body).toHaveTextContent(/nothing further is due/i);
    expect(body.textContent).toMatch(/2026/);
  });

  it("marks the status Paid so 'Trialing' does not read as 'owes money'", async () => {
    server.use(
      subscription({
        subscriptionStatus: "trialing",
        trialEndsAt: TRIAL_ENDS,
        trialPrepaid: true,
      }),
    );
    renderWithProviders(<BillingOverview />);

    expect(await screen.findByText("Paid")).toBeInTheDocument();
  });

  it("says nothing on an ordinary unpaid trial", async () => {
    server.use(
      subscription({ subscriptionStatus: "trialing", trialEndsAt: TRIAL_ENDS }),
    );
    renderWithProviders(<BillingOverview />);

    expect(await screen.findByText(/trial ends/i)).toBeInTheDocument();
    expect(screen.queryByText(/payment received/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Paid")).not.toBeInTheDocument();
  });

  // Once the prepayment is spent on the first invoice MC clears the flag and the
  // subscription is simply active — a stale flag must not claim a live trial.
  it("says nothing once the subscription has activated", async () => {
    server.use(
      subscription({
        subscriptionStatus: "active",
        trialEndsAt: TRIAL_ENDS,
        trialPrepaid: true,
      }),
    );
    renderWithProviders(<BillingOverview />);

    expect(await screen.findByText(/current period ends/i)).toBeInTheDocument();
    expect(screen.queryByText(/payment received/i)).not.toBeInTheDocument();
  });
});
