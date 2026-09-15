// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomePart } from "@/components/ecommerce/customize/parts/home-part";
import type { CustomizeDraft } from "@/components/ecommerce/customize/use-customize-draft";
import { getReadyMadeTheme } from "@/lib/storefront-themes";
import { sectionInstances } from "@/lib/storefront-templates";

// Reads the storefront settings query; its own test covers it.
vi.mock("@/components/ecommerce/customize/parts/landing-home-notice", () => ({
  LandingHomeNotice: () => null,
}));

const collection = (name: string, hasImage: boolean, isListed = true) =>
  ({ _id: name, name, displayName: "", slug: name, isListed, hasImage,
     seoTitle: "", seoDescription: "" }) as CustomizeDraft["collections"][number];

const draftFor = (
  themeId: string,
  collections: CustomizeDraft["collections"] = [],
): CustomizeDraft => {
  const theme = getReadyMadeTheme(themeId)!;
  return {
    templates: { ...theme.templates },
    homepageSections: sectionInstances(theme.sections).sections,
    homeCollections: {},
    sectionConfig: [],
    collections,
  } as unknown as CustomizeDraft;
};

const renderTheme = (
  themeId: string,
  collections?: CustomizeDraft["collections"],
) =>
  render(
    <HomePart
      draft={draftFor(themeId, collections)}
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

  it("offers the pictures-only row once every listed category has a picture", () => {
    renderTheme("classic", [
      collection("bakery", true),
      collection("drinks", true),
      // Unlisted and unphotographed — it is not in the row, so it cannot block it.
      collection("spares", false, false),
    ]);

    expect(screen.getByRole("button", { name: "Picture and name" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Picture only" })).toBeEnabled();
    expect(screen.getByText(/picture becomes the whole tile/)).toBeInTheDocument();
  });

  /* The defect this replaced: the chip was selectable, highlighted on click and
     changed nothing, because the storefront keeps the names until every listed
     category is photographed. A refusing control and a broken one looked the
     same, so the count is the whole point of the message. */
  it("disables pictures-only and counts what is in the way", () => {
    renderTheme("classic", [
      collection("bakery", false),
      collection("drinks", false),
      collection("household", true),
    ]);

    expect(screen.getByRole("button", { name: "Picture only" })).toBeDisabled();
    // "Picture and name" must stay reachable — it is always honourable.
    expect(screen.getByRole("button", { name: "Picture and name" })).toBeEnabled();
    expect(
      screen.getByText(/2 listed categories have no picture/),
    ).toBeInTheDocument();
  });

  it("counts a single blocker in the singular", () => {
    renderTheme("classic", [
      collection("bakery", false),
      collection("household", true),
    ]);

    expect(
      screen.getByText(/1 listed category has no picture/),
    ).toBeInTheDocument();
  });

  it("replaces dead Meridian Care controls with sidebar guidance", () => {
    renderTheme("meridian-care");

    expect(
      screen.getByText(/Categories are already shown in the Page layout sidebar/),
    ).toBeInTheDocument();
    expect(screen.queryByText("Scrolling strip")).not.toBeInTheDocument();
    expect(screen.queryByText("Name below")).not.toBeInTheDocument();
    expect(screen.queryByText("Picture only")).not.toBeInTheDocument();
  });
});
