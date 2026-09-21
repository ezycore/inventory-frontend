import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StorefrontSite } from "@/services/api";

const publish = vi.fn();

vi.mock("@/services/api", () => ({
  usePublishStorefrontSite: () => ({ mutate: publish, isPending: false }),
  useDiscardStorefrontSiteDraft: () => ({ mutate: vi.fn(), isPending: false }),
  useRestoreStorefrontSiteRevision: () => ({ mutate: vi.fn(), isPending: false }),
  useStorefrontSiteRevisions: () => ({ data: [], isLoading: false }),
}));

import { SitePublishBar } from "./site-publish-bar";

const site = (withDraft: boolean) =>
  ({
    _id: "site",
    organizationId: "org",
    published: { look: {}, version: 4, publishedAt: "2026-09-15T00:00:00.000Z" },
    draft: withDraft ? { look: {}, updatedAt: "2026-09-15T00:00:00.000Z" } : null,
    draftVersion: 7,
    createdAt: "2026-09-15T00:00:00.000Z",
    updatedAt: "2026-09-15T00:00:00.000Z",
  }) as unknown as StorefrontSite;

beforeEach(() => publish.mockReset());

describe("SitePublishBar", () => {
  it("has nothing to publish when the draft matches what shoppers see", () => {
    render(<SitePublishBar site={site(false)} unsavedEdits={false} />);

    expect(screen.getByRole("button", { name: "Published" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Discard changes" })).toBeNull();
  });

  it("publishes a saved draft", () => {
    render(<SitePublishBar site={site(true)} unsavedEdits={false} />);

    expect(screen.getByRole("status")).toHaveTextContent("Unpublished changes");
    fireEvent.click(screen.getByRole("button", { name: "Publish changes" }));
    expect(publish).toHaveBeenCalledTimes(1);
  });

  it("waits for unsaved edits to be saved before publishing or discarding", () => {
    render(<SitePublishBar site={site(true)} unsavedEdits />);

    expect(screen.getByRole("button", { name: "Publish changes" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Discard changes" })).toBeDisabled();
    expect(screen.getByText("Save your changes to publish them.")).toBeInTheDocument();
  });
});
