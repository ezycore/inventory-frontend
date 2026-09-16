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

  it("offers no address for the home page, which keeps the store's own, and still saves", () => {
    const home = { ...page, kind: "system", systemKey: "home", slug: undefined, title: "Home" } as unknown as StorefrontPage;
    render(<PageSettingsDialog page={home} open onOpenChange={() => {}} />);
    expect(screen.queryByLabelText("Address")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0][0].body).not.toHaveProperty("slug");
  });

  it("offers no schedule on a page that is not a landing page", () => {
    const content = { ...page, kind: "content" } as unknown as StorefrontPage;
    render(<PageSettingsDialog page={content} open onOpenChange={() => {}} />);
    expect(screen.queryByText("Schedule")).toBeNull();
  });
});

describe("PageSettingsDialog — schedule", () => {
  beforeEach(() => mutate.mockReset());

  const landing = { ...page, kind: "landing" } as unknown as StorefrontPage;
  /** A local wall-clock instant, so the test reads the same in any time zone. */
  const local = (day: number, hour: number) => new Date(2026, 8, day, hour, 0).toISOString();
  const scheduled = {
    ...landing,
    schedule: { startsAt: local(20, 9), endsAt: local(25, 21), afterEnd: "home", afterEndPageId: null },
  } as unknown as StorefrontPage;

  it("sends no schedule when it did not change", () => {
    render(<PageSettingsDialog page={scheduled} open onOpenChange={() => {}} />);
    expect(screen.getByLabelText("Starts time")).toHaveValue("09:00");
    expect(screen.getByLabelText("Ends time")).toHaveValue("21:00");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(mutate.mock.calls[0][0].body).not.toHaveProperty("schedule");
  });

  it("sends the whole schedule when a time changes", () => {
    render(<PageSettingsDialog page={scheduled} open onOpenChange={() => {}} />);
    fireEvent.change(screen.getByLabelText("Ends time"), { target: { value: "23:30" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(mutate.mock.calls[0][0].body.schedule).toEqual({
      startsAt: local(20, 9),
      endsAt: new Date(2026, 8, 25, 23, 30).toISOString(),
      afterEnd: "home",
      afterEndPageId: null,
    });
  });

  it("will not save an end before the start", () => {
    const sameDay = {
      ...scheduled,
      schedule: { startsAt: local(20, 9), endsAt: local(20, 21), afterEnd: "not-found", afterEndPageId: null },
    } as unknown as StorefrontPage;
    render(<PageSettingsDialog page={sameDay} open onOpenChange={() => {}} />);
    fireEvent.change(screen.getByLabelText("Ends time"), { target: { value: "08:00" } });
    expect(screen.getByText("The end must be after the start")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("asks what happens after the end only once there is an end", () => {
    render(<PageSettingsDialog page={landing} open onOpenChange={() => {}} />);
    expect(screen.getByText("Schedule")).toBeInTheDocument();
    expect(screen.getByLabelText("Starts time")).toBeDisabled();
    expect(screen.queryByLabelText("After it ends")).toBeNull();

    render(<PageSettingsDialog page={scheduled} open onOpenChange={() => {}} />);
    expect(screen.getByLabelText("After it ends")).toBeInTheDocument();
  });
});
