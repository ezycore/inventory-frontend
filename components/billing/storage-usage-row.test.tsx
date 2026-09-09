// coding-standard: maintained
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";

import { server } from "@/tests/mocks/server";
import { renderWithProviders, screen, waitFor } from "@/tests/test-utils";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { BillingOverview } from "./billing-overview";

/**
 * The storage meter on Settings → Billing.
 *
 * The backend has enforced `storageGb` since Phase 4 of its
 * `docs/plan/storage-metering.md`, and `useStorageLimit` has computed the warn
 * band since the same day — but nothing rendered either, so a merchant's first
 * and only signal was a `PLAN_LIMIT_EXCEEDED` on an upload they had already
 * filled a form for. These tests exist to keep the meter mounted: the hook
 * having no caller is not a state a type-check or the hook's own unit tests can
 * see, and that is exactly how it shipped invisible.
 *
 * Rendered through `BillingOverview` rather than the row in isolation so the
 * mounting itself is covered, not only the row's internals.
 */
const GB = 1024 ** 3;

const subscription = (usage: Record<string, unknown>, limits: Record<string, number>) =>
  http.get("*/api/organization/subscription", () =>
    HttpResponse.json({
      success: true,
      data: {
        entitlement: {
          status: "active",
          subscriptionStatus: "active",
          planSlug: "growth",
          planName: "Growth",
          limits,
          features: {},
        },
        usage: {
          locations: 1,
          users: 1,
          inventory: 10,
          salesToday: 0,
          purchasesToday: 0,
          ...usage,
        },
      },
    }),
  );

const signIn = (permissions: string[]) =>
  useAuthStore.setState({
    user: {
      id: "user-1",
      email: "owner@example.com",
      role: "owner",
      permissions,
      organization: { name: "Test Org", slug: "test-org", currency: "BDT" },
    },
    token: "test-token",
    isAuthenticated: true,
  });

beforeEach(() => signIn(["organization.view", "organization.edit"]));
afterEach(() => useAuthStore.setState({ user: null, isAuthenticated: false }));

describe("the billing storage meter", () => {
  it("shows used against the plan's ceiling, both with units", async () => {
    server.use(subscription({ storageBytes: 1.5 * GB }, { storageGb: 2 }));
    renderWithProviders(<BillingOverview />);

    expect(await screen.findByText("1.5 GB")).toBeInTheDocument();
    expect(screen.getByText("of 2 GB")).toBeInTheDocument();
  });

  it("puts the fraction on the badge so the bar is not the only reading", async () => {
    server.use(subscription({ storageBytes: 1.5 * GB }, { storageGb: 2 }));
    renderWithProviders(<BillingOverview />);

    expect(await screen.findByText("75%")).toBeInTheDocument();
  });

  it("says <1% rather than 0% for a merchant who has barely started", async () => {
    // A few product photos against gigabytes rounds to zero, and "0%" next to a
    // real figure reads as a broken meter rather than as "barely any".
    server.use(subscription({ storageBytes: 2 * 1024 ** 2 }, { storageGb: 2 }));
    renderWithProviders(<BillingOverview />);

    expect(await screen.findByText("<1%")).toBeInTheDocument();
  });

  it("warns before it blocks, and says what to do about it", async () => {
    // 80% is the point `useStorageLimit` and the backend's STORAGE_WARN_RATIO
    // agree on. The warning is the whole reason the threshold exists: storage
    // is the one cap a merchant cannot free in the moment they hit it.
    server.use(subscription({ storageBytes: 1.7 * GB }, { storageGb: 2 }));
    renderWithProviders(<BillingOverview />);

    expect(await screen.findByText(/Storage is nearly full/)).toBeInTheDocument();
    expect(screen.queryByText(/Storage is full/)).not.toBeInTheDocument();
  });

  it("says uploads are refused once the cap is reached", async () => {
    // Exclusive with the warning above: a merchant already being refused should
    // be told they are refused, not that they are approaching a cap.
    server.use(subscription({ storageBytes: 2 * GB }, { storageGb: 2 }));
    renderWithProviders(<BillingOverview />);

    expect(await screen.findByText(/Storage is full/)).toBeInTheDocument();
    expect(screen.queryByText(/nearly full/)).not.toBeInTheDocument();
  });

  it("still says 0% for a workspace that has uploaded nothing", async () => {
    // The "<1%" floor above is for "barely any", not for "none".
    server.use(subscription({ storageBytes: 0 }, { storageGb: 2 }));
    renderWithProviders(<BillingOverview />);

    expect(await screen.findByText("0%")).toBeInTheDocument();
    expect(screen.getByText("0 B")).toBeInTheDocument();
  });

  it("stays quiet well below the threshold", async () => {
    server.use(subscription({ storageBytes: 0.2 * GB }, { storageGb: 2 }));
    renderWithProviders(<BillingOverview />);

    await screen.findByText("Storage");
    expect(screen.queryByText(/Storage is/)).not.toBeInTheDocument();
  });

  it("reports usage against an Unlimited badge when the plan sets no ceiling", async () => {
    // There is no bar to draw and no percentage to compute, which is what made
    // this the flattest line in the card when it was a plain row. The badge is
    // what makes the missing bar read as deliberate.
    server.use(subscription({ storageBytes: 3 * GB }, {}));
    renderWithProviders(<BillingOverview />);

    expect(await screen.findByText("3 GB")).toBeInTheDocument();
    expect(screen.getByText("used")).toBeInTheDocument();
    expect(screen.getByText("Unlimited")).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("renders nothing rather than 0 B when usage cannot be read", async () => {
    // The subscription payload is `organization.view`-gated. A cached response
    // from a session that held it must not be reported as real usage — "0 B"
    // is a claim that the merchant's storage is empty.
    signIn(["organization.edit"]);
    server.use(subscription({ storageBytes: 2 * GB }, { storageGb: 2 }));
    renderWithProviders(<BillingOverview />);

    // The rest of the card still renders — only the storage row withholds.
    await screen.findByText("Locations");
    await waitFor(() =>
      expect(screen.queryByText("Storage")).not.toBeInTheDocument(),
    );
    expect(screen.queryByText("0 B")).not.toBeInTheDocument();
  });
});
