// coding-standard: maintained
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LandingHomeNotice } from "@/components/ecommerce/customize/parts/landing-home-notice";

const settings = vi.hoisted(() => ({ current: undefined as { homePageId?: string } | undefined }));

vi.mock("@/services/api", () => ({
  useGetStorefrontSettings: () => ({ data: settings.current }),
}));

afterEach(() => {
  cleanup();
  settings.current = undefined;
});

describe("LandingHomeNotice", () => {
  it("says nothing while the Customize home is the homepage", () => {
    settings.current = { homePageId: undefined };
    const { container } = render(<LandingHomeNotice />);
    expect(container.textContent).toBe("");
  });

  it("says nothing before the settings arrive", () => {
    const { container } = render(<LandingHomeNotice />);
    expect(container.textContent).toBe("");
  });

  it("points to Pages when a landing page is the homepage", () => {
    settings.current = { homePageId: "page-1" };
    render(<LandingHomeNotice />);
    expect(screen.getByText(/shoppers don't see these sections/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Pages" }).getAttribute("href")).toBe("/ecommerce/pages");
  });
});
