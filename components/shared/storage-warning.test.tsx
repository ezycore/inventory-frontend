// coding-standard: maintained
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";

import { server } from "@/tests/mocks/server";
import { renderWithProviders, screen, waitFor } from "@/tests/test-utils";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { ImageGalleryUpload } from "@/components/shared/image-gallery-upload";

/**
 * The storage warning where it is actually spent — inside an image field.
 *
 * The billing meter was the first half of the warn-then-block decision in the
 * backend's `docs/plan/storage-metering.md`, and on its own it still missed the
 * merchant it was written for: someone adding a product has no reason to open
 * the billing page, so the only signal they got was the upload being refused.
 *
 * These render the notice through a REAL upload surface rather than alone, for
 * the same reason the meter's tests go through `BillingOverview`: the defect to
 * guard against is the notice not being mounted, which a test of the component
 * by itself cannot see.
 */
const GB = 1024 ** 3;

const subscription = (storageBytes: number, limits: Record<string, number>) =>
  http.get("*/api/organization/subscription", () =>
    HttpResponse.json({
      success: true,
      data: {
        entitlement: { status: "active", limits, features: {} },
        usage: { locations: 0, users: 0, inventory: 0, storageBytes },
      },
    }),
  );

const signIn = (permissions: string[]) =>
  useAuthStore.setState({
    user: {
      id: "user-1",
      email: "staff@example.com",
      role: "manager",
      permissions,
      organization: { name: "Test Org", slug: "test-org", currency: "BDT" },
    },
    token: "test-token",
    isAuthenticated: true,
  });

const gallery = (client?: QueryClient) =>
  renderWithProviders(<ImageGalleryUpload value={[]} onChange={() => {}} />, {
    client,
  });

beforeEach(() => signIn(["organization.view", "organization.edit"]));
afterEach(() => useAuthStore.setState({ user: null, isAuthenticated: false }));

describe("the storage notice on an upload field", () => {
  it("warns from 80% with what is left, before a file is picked", async () => {
    // The figure that matters to someone about to upload is the headroom, not
    // the total: "1.6 GB used" does not answer "will this photo fit".
    server.use(subscription(1.7 * GB, { storageGb: 2 }));
    gallery();

    expect(
      await screen.findByText(/Storage is 85% full — about 307.2 MB left/),
    ).toBeInTheDocument();
  });

  it("says uploads are refused once the cap is reached", async () => {
    server.use(subscription(2 * GB, { storageGb: 2 }));
    gallery();

    expect(
      await screen.findByText(/New images will not upload/),
    ).toBeInTheDocument();
  });

  it("offers the upgrade path to someone who can take it", async () => {
    server.use(subscription(2 * GB, { storageGb: 2 }));
    gallery();

    const link = await screen.findByRole("link", { name: "Upgrade plan" });
    expect(link).toHaveAttribute("href", "/dashboard/billing");
  });

  it("withholds the link from a user who cannot change the plan", async () => {
    // Sending a staff member to a page that renders them a permission denial is
    // worse than telling them the fact and letting them ask their owner.
    signIn(["organization.view"]);
    server.use(subscription(2 * GB, { storageGb: 2 }));
    gallery();

    await screen.findByText(/New images will not upload/);
    expect(screen.queryByRole("link", { name: "Upgrade plan" })).toBeNull();
  });

  describe("stays silent when there is nothing to say", () => {
    const expectSilence = async () => {
      await waitFor(() =>
        expect(screen.queryByText(/Storage is/)).not.toBeInTheDocument(),
      );
    };

    it("well below the threshold", async () => {
      server.use(subscription(0.5 * GB, { storageGb: 2 }));
      gallery();
      await expectSilence();
    });

    it("on a plan with no storage ceiling", async () => {
      // No ceiling means no fraction of one to be near.
      server.use(subscription(500 * GB, {}));
      gallery();
      await expectSilence();
    });

    it("for a user whose role cannot read usage at all", async () => {
      // The subscription payload is `organization.view`-gated, so the query
      // never runs and there is nothing to warn from.
      signIn(["products.create"]);
      server.use(subscription(2 * GB, { storageGb: 2 }));
      gallery();
      await expectSilence();
    });

    it("when the permission goes away but the cached usage does not", async () => {
      // The case the `known` gate is actually FOR, and the one the test above
      // does not reach: with the query merely disabled there is no data to go
      // wrong. Here the payload is already cached from a moment when the
      // permission was held, so `atLimit` would still compute — and a warning
      // derived from usage we are no longer entitled to read is a guess.
      // `useStorageLimit` promises to degrade to `known: false`, never to a
      // false alarm; this is what holds it to that.
      // The shared test client sets `gcTime: 0`, which evicts a query the
      // moment it is disabled — so with it the payload vanishes on its own and
      // this test would pass without the gate ever running. A real gcTime is
      // what makes the cached data survive the permission going away, which is
      // the whole situation being reproduced.
      const client = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 60_000 } },
      });
      server.use(subscription(2 * GB, { storageGb: 2 }));
      gallery(client);
      await screen.findByText(/New images will not upload/);

      act(() => signIn(["products.create"]));
      await expectSilence();
    });
  });
});
