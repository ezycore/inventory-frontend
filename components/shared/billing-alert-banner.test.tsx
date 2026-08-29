import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/tests/mocks/server";
import {
  renderWithProviders,
  screen,
  waitFor,
} from "@/tests/test-utils";
import userEvent from "@testing-library/user-event";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { BillingAlertBanner } from "./billing-alert-banner";

const toastInfo = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    info: (...a: unknown[]) => toastInfo(...a),
    error: (...a: unknown[]) => toastError(...a),
  },
}));

// Full detail (organization.view-gated) — only the amount matters here,
// since `status` below is what the banner actually renders from.
const subscription = (over: Record<string, unknown>) =>
  http.get("*/api/organization/subscription", () =>
    HttpResponse.json({
      success: true,
      data: { entitlement: over, usage: { locations: 0, users: 0, inventory: 0 } },
    }),
  );

// Minimal, permission-free status — what the banner actually renders from.
// Real payload never carries `amount`; tests reuse the same `over` object for
// convenience, which is harmless since BillingAlertBanner only reads
// status/subscriptionStatus off this response.
const subscriptionStatus = (over: Record<string, unknown>) =>
  http.get("*/api/organization/subscription/status", () =>
    HttpResponse.json({ success: true, data: { entitlement: over } }),
  );

let hrefSpy: string;
const originalLocation = window.location;

/** Everyone sees the banner text, but only a billing manager gets the actions. */
const signInAsBillingManager = () =>
  useAuthStore.setState({
    user: {
      id: "user-1",
      email: "owner@example.com",
      role: "owner",
      permissions: ["organization.edit"],
      organization: { name: "Test Org", slug: "test-org", currency: "BDT" },
    },
    token: "test-token",
    isAuthenticated: true,
  });

beforeEach(() => {
  toastInfo.mockClear();
  toastError.mockClear();
  hrefSpy = "";
  signInAsBillingManager();
  // jsdom does not implement navigation; swap location for a capturable stub.
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      ...originalLocation,
      set href(v: string) {
        hrefSpy = v;
      },
      get href() {
        return hrefSpy;
      },
    },
  });
});

afterEach(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: originalLocation,
  });
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
});

describe("BillingAlertBanner", () => {
  it("is hidden for a healthy subscription", async () => {
    server.use(
      subscription({ status: "active", subscriptionStatus: "active", amount: 500 }),
      subscriptionStatus({ status: "active", subscriptionStatus: "active" }),
    );
    renderWithProviders(<BillingAlertBanner />);
    // Give the query a tick; banner must never appear.
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText(/overdue/i)).not.toBeInTheDocument();
  });

  it("shows the overdue banner with the amount when past_due", async () => {
    server.use(
      subscription({
        status: "read_only",
        subscriptionStatus: "past_due",
        amount: 500,
      }),
      subscriptionStatus({ status: "read_only", subscriptionStatus: "past_due" }),
    );
    renderWithProviders(<BillingAlertBanner />);
    expect(await screen.findByText(/overdue/i)).toBeInTheDocument();
    // Amount is rendered (currency-formatted 500 → contains "500").
    expect(screen.getByText(/500/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /pay now/i }),
    ).toBeInTheDocument();
  });

  it("Pay now fetches a live link and redirects to it", async () => {
    let payLinkHit = false;
    server.use(
      subscription({ status: "read_only", subscriptionStatus: "past_due", amount: 500 }),
      subscriptionStatus({ status: "read_only", subscriptionStatus: "past_due" }),
      http.get("*/api/organization/billing/pay-link", () => {
        payLinkHit = true;
        return HttpResponse.json({
          success: true,
          data: {
            url: "https://sandbox.sslcommerz.com/pay/abc123",
            gateway: "sslcommerz",
            status: "due",
          },
        });
      }),
    );
    renderWithProviders(<BillingAlertBanner />);
    const btn = await screen.findByRole("button", { name: /pay now/i });
    await userEvent.click(btn);

    await waitFor(() => expect(payLinkHit).toBe(true));
    await waitFor(() =>
      expect(hrefSpy).toBe("https://sandbox.sslcommerz.com/pay/abc123"),
    );
    expect(toastInfo).not.toHaveBeenCalled();
  });

  it("Pay now with nothing due shows a toast and does not redirect", async () => {
    server.use(
      subscription({ status: "read_only", subscriptionStatus: "past_due", amount: 500 }),
      subscriptionStatus({ status: "read_only", subscriptionStatus: "past_due" }),
      http.get("*/api/organization/billing/pay-link", () =>
        HttpResponse.json({
          success: true,
          data: { url: null, gateway: "sslcommerz", status: "paid" },
        }),
      ),
    );
    renderWithProviders(<BillingAlertBanner />);
    const btn = await screen.findByRole("button", { name: /pay now/i });
    await userEvent.click(btn);

    await waitFor(() => expect(toastInfo).toHaveBeenCalledTimes(1));
    expect(hrefSpy).toBe("");
  });

  it("Pay now with status 'due' but no url shows an error, not 'nothing owed'", async () => {
    server.use(
      subscription({ status: "read_only", subscriptionStatus: "past_due", amount: 500 }),
      subscriptionStatus({ status: "read_only", subscriptionStatus: "past_due" }),
      http.get("*/api/organization/billing/pay-link", () =>
        HttpResponse.json({
          success: true,
          data: { url: null, gateway: "sslcommerz", status: "due" },
        }),
      ),
    );
    renderWithProviders(<BillingAlertBanner />);
    const btn = await screen.findByRole("button", { name: /pay now/i });
    await userEvent.click(btn);

    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));
    expect(toastInfo).not.toHaveBeenCalled();
    expect(hrefSpy).toBe("");
  });
});
