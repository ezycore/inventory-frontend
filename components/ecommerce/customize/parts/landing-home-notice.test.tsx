// coding-standard: maintained
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LandingHomeNotice } from "@/components/ecommerce/customize/parts/landing-home-notice";

const settings = vi.hoisted(() => ({ current: undefined as { homePageId?: string } | undefined }));
const systemPages = vi.hoisted(() => ({ current: undefined as { _id: string; systemKey?: string }[] | undefined }));

vi.mock("@/services/api", () => ({
  useGetStorefrontSettings: () => ({ data: settings.current }),
  useStorefrontPages: () => ({ data: systemPages.current && { items: systemPages.current } }),
}));

afterEach(() => {
  cleanup();
  settings.current = undefined;
  systemPages.current = undefined;
});

describe("LandingHomeNotice", () => {
  it("says nothing while the Customize home is the homepage", () => {
    settings.current = { homePageId: undefined };
    systemPages.current = [];
    const { container } = render(<LandingHomeNotice />);
    expect(container.textContent).toBe("");
  });

  it("says nothing before the settings arrive", () => {
    systemPages.current = [{ _id: "home-1", systemKey: "home" }];
    const { container } = render(<LandingHomeNotice />);
    expect(container.textContent).toBe("");
  });

  it("points to Pages when a landing page is the homepage", () => {
    settings.current = { homePageId: "page-1" };
    render(<LandingHomeNotice />);
    expect(screen.getByText(/shoppers don't see these sections/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Pages" }).getAttribute("href")).toBe("/ecommerce/pages");
  });

  it("points to the page editor when the home is a builder page", () => {
    settings.current = { homePageId: undefined };
    systemPages.current = [{ _id: "home-1", systemKey: "home" }];
    render(<LandingHomeNotice />);
    expect(screen.getByText(/built from sections now/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "page editor" }).getAttribute("href")).toBe("/ecommerce/pages/home-1");
  });
});
