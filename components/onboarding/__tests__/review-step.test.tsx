import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/tests/test-utils";
import { DEFAULT_ORGANIZATION_FEATURES, type OrganizationFeatures } from "@/types";
import { ANSWERED_FEATURES, REVIEW_ONLY_FEATURES } from "../steps";
import { ReviewStep } from "../review-step";

/**
 * The review screen is the only place in the wizard that renders a switch per
 * feature, so it is the only place that can offer one the plan does not grant —
 * and touching that switch 403s (`FEATURE_NOT_IN_PLAN`) with a toast that says
 * nothing about which row failed.
 */
const ROW_COUNT = ANSWERED_FEATURES.length + REVIEW_ONLY_FEATURES.length;

const allOn = (): OrganizationFeatures => ({ ...DEFAULT_ORGANIZATION_FEATURES });

const renderReview = (planFeatures: OrganizationFeatures | undefined) =>
  renderWithProviders(
    <ReviewStep
      features={allOn()}
      planFeatures={planFeatures}
      pendingFeature={null}
      isSaving={false}
      onBack={vi.fn()}
      onConfirm={vi.fn()}
      onToggle={vi.fn()}
    />,
  );

describe("ReviewStep — the plan ceiling", () => {
  it("gives every feature a switch when the plan grants them all", () => {
    renderReview(allOn());

    expect(screen.getAllByRole("switch")).toHaveLength(ROW_COUNT);
    expect(screen.queryByText("Not included in your plan.")).toBeNull();
  });

  it("locks the row a plan withholds instead of offering a switch", () => {
    renderReview({ ...allOn(), storefront: false });

    expect(screen.getAllByRole("switch")).toHaveLength(ROW_COUNT - 1);
    // The reason replaces the description on the locked row, so the merchant is
    // told why rather than left with a switch that fails.
    expect(screen.getByText("Not included in your plan.")).toBeVisible();
  });

  it("falls back to the effective set while the ceiling is still loading", () => {
    // `planFeatures` arrives with `features` in one response, so this is a frame,
    // not a state — but a fallback of "locked" would flash nine padlocks.
    renderReview(undefined);

    expect(screen.getAllByRole("switch")).toHaveLength(ROW_COUNT);
  });
});
