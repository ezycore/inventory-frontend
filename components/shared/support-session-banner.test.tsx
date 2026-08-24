// coding-standard: maintained
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import userEvent from "@testing-library/user-event";

import { server } from "@/tests/mocks/server";
import { renderWithProviders, screen } from "@/tests/test-utils";
import { useAuthStore } from "@/services/stores/use-auth-store";

import { SupportSessionBanner } from "./support-session-banner";

/**
 * The banner is what lets support access ship WITHOUT asking the merchant's
 * permission first (`mission-control/plan/support-session.md` §5). The design
 * has no opt-out toggle; what it promises instead is that access is read-only,
 * time-boxed, recorded, **visible while it happens, and stoppable**. The last
 * two are this component — so a silent regression here changes what the product
 * honestly is, not just how it looks.
 *
 * The branch worth pinning is the two-audience one: the same component tells the
 * operator their own time is running out and tells the merchant that someone is
 * in their workspace. Getting that backwards would show a merchant a countdown
 * for a session they are not in, or offer an operator a button labelled as
 * though someone else were being watched.
 */

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...a: unknown[]) => toastSuccess(...a),
    error: (...a: unknown[]) => toastError(...a),
  },
}));

const SESSION_ID = "6a8bf692e354e8e068a71d3b";

const sessions = (rows: Record<string, unknown>[]) =>
  http.get("*/api/support-sessions", () =>
    HttpResponse.json({ success: true, data: rows }),
  );

const liveSession = (over: Record<string, unknown> = {}) => ({
  _id: SESSION_ID,
  organizationId: "org-1",
  mcUserEmail: "support@ezycore.com",
  reason: "Ticket #412 - wrong stock counts",
  mode: "read",
  status: "active",
  startedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
  requestCount: 3,
  ...over,
});

const signIn = (supportSessionId: string | null) =>
  useAuthStore.setState({
    user: {
      id: "user-1",
      email: "owner@example.com",
      role: supportSessionId ? "ezycore_support" : "admin",
      permissions: ["organization.view", "organization.manage"],
      organization: { name: "QA Pharmacy", slug: "qa-pharmacy", currency: "BDT" },
    },
    token: "test-token",
    isAuthenticated: true,
    supportSessionId,
  });

beforeEach(() => {
  toastSuccess.mockClear();
  toastError.mockClear();
});

afterEach(() => {
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
    supportSessionId: null,
  });
});

describe("SupportSessionBanner", () => {
  it("stays hidden when nobody is in the workspace", async () => {
    server.use(sessions([]));
    signIn(null);

    renderWithProviders(<SupportSessionBanner />);

    // Give the query a tick; the banner must never appear.
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByRole("button", { name: /end session/i })).toBeNull();
  });

  it("stays hidden once the only session has ended", async () => {
    // The disappearance matters as much as the appearance: a merchant who left
    // the tab open must stop being told they are being watched when they are not.
    server.use(sessions([liveSession({ status: "ended", endedBy: "merchant" })]));
    signIn(null);

    renderWithProviders(<SupportSessionBanner />);

    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByRole("button", { name: /end session/i })).toBeNull();
  });

  it("tells the MERCHANT who is in their workspace, and why", async () => {
    server.use(sessions([liveSession()]));
    signIn(null);

    renderWithProviders(<SupportSessionBanner />);

    expect(await screen.findByText(/support@ezycore\.com/)).toBeInTheDocument();
    expect(
      screen.getByText(/Ticket #412 - wrong stock counts/),
    ).toBeInTheDocument();
    // The merchant is not shown a countdown — it is not their clock.
    expect(screen.queryByText(/Ends in/i)).toBeNull();
  });

  it("tells the OPERATOR their own session is read-only and running out", async () => {
    server.use(sessions([liveSession()]));
    signIn(SESSION_ID);

    renderWithProviders(<SupportSessionBanner />);

    expect(
      await screen.findByText(/read-only support session/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Ends in/i)).toBeInTheDocument();
  });

  it("lets the merchant end the session, naming that session", async () => {
    let endedId: string | null = null;
    server.use(
      sessions([liveSession()]),
      http.post("*/api/support-sessions/:id/end", ({ params }) => {
        endedId = params.id as string;
        return HttpResponse.json({ success: true, data: liveSession({ status: "ended" }) });
      }),
    );
    signIn(null);

    renderWithProviders(<SupportSessionBanner />);
    await userEvent.click(
      await screen.findByRole("button", { name: /end session/i }),
    );

    expect(endedId).toBe(SESSION_ID);
    expect(toastSuccess).toHaveBeenCalled();
  });

  it("sends the operator's own exit to the self-service route, not the merchant one", async () => {
    // Two different endpoints, and picking the wrong one is invisible until a
    // support session tries to close itself: the merchant route needs
    // `organization.manage`, which a support principal does not hold.
    let selfEndHit = false;
    let merchantEndHit = false;
    server.use(
      sessions([liveSession()]),
      http.post("*/api/auth/support/end", () => {
        selfEndHit = true;
        return HttpResponse.json({ success: true, data: null });
      }),
      http.post("*/api/support-sessions/:id/end", () => {
        merchantEndHit = true;
        return HttpResponse.json({ success: true, data: null });
      }),
    );
    signIn(SESSION_ID);

    renderWithProviders(<SupportSessionBanner />);
    await userEvent.click(
      await screen.findByRole("button", { name: /end session/i }),
    );

    expect(selfEndHit).toBe(true);
    expect(merchantEndHit).toBe(false);
  });
});
