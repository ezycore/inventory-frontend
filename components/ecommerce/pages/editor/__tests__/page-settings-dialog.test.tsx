// coding-standard: maintained
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StorefrontPage } from "@/services/api";

// Radix's Switch and Select measure themselves; jsdom has no ResizeObserver.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const mutate = vi.hoisted(() => vi.fn());
vi.mock("@/services/api", () => ({
  useUpdateStorefrontPage: () => ({ mutate, isPending: false }),
}));

import { PageSettingsDialog } from "../page-settings-dialog";

/**
 * The page's own settings form: it starts from the page as it is, suggests the
 * page name as the search title, and does not rename a page nobody renamed — a
 * rename leaves a redirect behind.
 */
const page = {
  _id: "page-1",
  title: "QA editor landing",
  slug: "qa-editor",
  chrome: "minimal",
  seo: { noindex: true },
  published: null,
} as unknown as StorefrontPage;

describe("PageSettingsDialog", () => {
  beforeEach(() => mutate.mockReset());

  it("starts from the page, with the page name as the search title's suggestion", () => {
    render(<PageSettingsDialog page={page} open onOpenChange={() => {}} />);
    expect(screen.getByLabelText("Page name")).toHaveValue("QA editor landing");
    const searchTitle = screen.getByLabelText("Title");
    expect(searchTitle).toHaveValue("");
    expect(searchTitle).toHaveAttribute("placeholder", "QA editor landing");
  });

  it("saves without a slug when the address did not change", () => {
    render(<PageSettingsDialog page={page} open onOpenChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(mutate).toHaveBeenCalledTimes(1);
    const [{ body }] = mutate.mock.calls[0];
    expect(body).not.toHaveProperty("slug");
    expect(body).toMatchObject({ title: "QA editor landing", chrome: "minimal", seo: { noindex: true } });
  });
});
