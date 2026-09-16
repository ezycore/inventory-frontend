// coding-standard: maintained

import { fireEvent, screen, within } from "@testing-library/react";
import { renderWithProviders } from "@/tests/test-utils";
import { TooltipProvider } from "@/ui/components/tooltip";
import { describe, expect, it, vi } from "vitest";
import { LookPart } from "@/components/ecommerce/customize/parts/look-part";
import type { CustomizeDraftApi } from "@/components/ecommerce/customize/use-customize-draft";
import { DEFAULT_DESIGN } from "@/lib/storefront-theme";
import type { StorefrontSettings } from "@/types";

// The media upload and the auth store are the logo block's, not these controls'.
vi.mock("@/services/api", () => ({ useUpdateStorefrontMedia: () => ({ mutate: vi.fn(), isPending: false }) }));
vi.mock("@/services/stores/use-auth-store", () => ({ useAuthStore: () => undefined }));
vi.mock("@/components/ecommerce/customize/parts/start-here", () => ({ StartHere: () => null }));

const renderLook = (design = DEFAULT_DESIGN) => {
  const patch = vi.fn();
  const draft = { preset: "default", brandColor: "#111827", accentColor: "#2563eb", design } as unknown as CustomizeDraftApi["draft"];
  renderWithProviders(
    <TooltipProvider>
      <LookPart settings={{} as StorefrontSettings} draft={draft} patch={patch} />
    </TooltipProvider>,
  );
  return patch;
};

/** Plan §17, Phase 6 step 8: buttons and heading type in Customize → Look. */
describe("LookPart — buttons and heading type", () => {
  it("opens every new control on Default for a store that never set them", () => {
    renderLook();
    for (const name of ["Button shape", "Button size"]) {
      const group = screen.getByRole("group", { name });
      expect(within(group).getByRole("button", { name: "Default" })).toHaveAttribute("aria-pressed", "true");
    }
    expect(
      within(screen.getByRole("group", { name: "Button style" })).getByRole("button", { name: "Solid" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(screen.getByRole("group", { name: "Heading letters" })).getByRole("button", { name: "As typed" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("writes a choice into the design block, leaving the other axes as they were", () => {
    const patch = renderLook({ ...DEFAULT_DESIGN, font: "serif" });
    fireEvent.click(within(screen.getByRole("group", { name: "Button shape" })).getByRole("button", { name: "Pill" }));
    expect(patch).toHaveBeenCalledWith({ design: { ...DEFAULT_DESIGN, font: "serif", buttonShape: "pill" } });

    fireEvent.click(within(screen.getByRole("group", { name: "Heading weight" })).getByRole("button", { name: "Heavy" }));
    expect(patch).toHaveBeenLastCalledWith({ design: { ...DEFAULT_DESIGN, font: "serif", headingWeight: "heavy" } });
  });
});
