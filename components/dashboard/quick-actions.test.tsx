import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/tests/test-utils";
import { useAuthStore } from "@/services/stores/use-auth-store";
import type { OrganizationFeatures } from "@/types";
import { QuickActions } from "./quick-actions";

// The card navigates imperatively; there is no app router in the test tree.
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: (...args: unknown[]) => push(...args) }),
}));

/**
 * Quick Actions are shortcuts into screens the sidebar already gates. Before
 * this was enforced they were a hardcoded list, so a shop that turned the POS
 * off during onboarding still got a "New Sale" button on its dashboard — the
 * one entry point the nav work had just removed.
 */
const signIn = (
  permissions: string[],
  features: Partial<OrganizationFeatures>,
) =>
  useAuthStore.setState({
    user: {
      id: "user-1",
      email: "owner@example.com",
      role: "owner",
      permissions,
      organization: {
        name: "Test Org",
        slug: "test-org",
        features: features as OrganizationFeatures,
      },
    },
    token: "test-token",
    isAuthenticated: true,
  });

/** Everything a full-access owner of an all-features-on org can reach. */
const ALL_PERMISSIONS = [
  "sales.create",
  "purchases.create",
  "products.create",
  "stock.manage",
  "reports.view",
];
const ALL_FEATURES = { sales: true, multiLocation: true };

const labels = () => screen.getAllByRole("button").map((b) => b.textContent);

beforeEach(() => {
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
});

describe("QuickActions", () => {
  it("shows every shortcut when features and permissions allow it", () => {
    signIn(ALL_PERMISSIONS, ALL_FEATURES);
    renderWithProviders(<QuickActions />);

    // The positive control: without this, the gating assertions below would
    // pass just as happily against a card that rendered nothing at all.
    expect(labels()).toEqual([
      "New Sale",
      "Purchase",
      "Add Product",
      "Transfer Stock",
      "Adjust Stock",
      "View Reports",
    ]);
  });

  it("hides New Sale when the POS feature is off", () => {
    signIn(ALL_PERMISSIONS, { ...ALL_FEATURES, sales: false });
    renderWithProviders(<QuickActions />);

    expect(labels()).not.toContain("New Sale");
    expect(labels()).toContain("Purchase");
  });

  it("hides Transfer Stock for a single-location shop", () => {
    signIn(ALL_PERMISSIONS, { ...ALL_FEATURES, multiLocation: false });
    renderWithProviders(<QuickActions />);

    expect(labels()).not.toContain("Transfer Stock");
    expect(labels()).toContain("Adjust Stock");
  });

  it("hides shortcuts the user lacks permission for", () => {
    // A staff-shaped user: stock work yes, reports and purchasing no.
    signIn(["products.create", "stock.manage"], ALL_FEATURES);
    renderWithProviders(<QuickActions />);

    expect(labels()).toEqual(["Add Product", "Transfer Stock", "Adjust Stock"]);
  });

  it("renders nothing rather than an empty card when all shortcuts are gated away", () => {
    signIn([], ALL_FEATURES);
    const { container } = renderWithProviders(<QuickActions />);

    // Not just "no buttons" — the whole card, heading included, must be gone.
    expect(container).toBeEmptyDOMElement();
  });
});
