// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomePart } from "@/components/ecommerce/customize/parts/home-part";
import type { CustomizeDraft } from "@/components/ecommerce/customize/use-customize-draft";
import { getReadyMadeTheme } from "@/lib/storefront-themes";
import { sectionInstances } from "@/lib/storefront-templates";

const draftFor = (themeId: string): CustomizeDraft => {
  const theme = getReadyMadeTheme(themeId)!;
  return {
    templates: { ...theme.templates },
    homepageSections: sectionInstances(theme.sections),
    homeCollections: {},
    sectionConfig: [],
    collections: [],
  } as unknown as CustomizeDraft;
};

const renderTheme = (themeId: string) =>
  render(
    <HomePart
      draft={draftFor(themeId)}
      patch={vi.fn()}
      patchTemplate={vi.fn()}
      patchHomeTemplate={vi.fn()}
    />,
  );

describe("HomePart category controls", () => {
  it("keeps Classic's category-chip layout controls", () => {
    renderTheme("classic");

    expect(screen.getByText("Scrolling strip")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Scrolling strip" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.queryByText("Name below")).not.toBeInTheDocument();
  });

  it.each(["fresh-market", "muslin"])(
    "shows layout and appearance controls for %s category tiles",
    (themeId) => {
      renderTheme(themeId);

      expect(screen.getByText("Scrolling strip")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Grid" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(screen.getByText("Name below")).toBeInTheDocument();
    },
  );

  it("replaces dead Meridian Care controls with sidebar guidance", () => {
    renderTheme("meridian-care");

    expect(
      screen.getByText(/Categories are already shown in the Page layout sidebar/),
    ).toBeInTheDocument();
    expect(screen.queryByText("Scrolling strip")).not.toBeInTheDocument();
    expect(screen.queryByText("Name below")).not.toBeInTheDocument();
  });
});
