import { fireEvent, renderWithProviders as render, screen, waitFor } from "@/tests/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StorefrontPageListItem, StorefrontSite } from "@/services/api";

const publish = vi.fn();
const discard = vi.fn();
const publishHome = vi.fn();
const discardHome = vi.fn();
const refetchHome = vi.fn();
let home: Partial<StorefrontPageListItem> | undefined;
let homeLookup: { isFetching: boolean; isError: boolean };

vi.mock("@/services/api", () => ({
  usePublishStorefrontSite: () => ({ mutateAsync: publish, isPending: false }),
  useDiscardStorefrontSiteDraft: () => ({ mutateAsync: discard, isPending: false }),
  useRestoreStorefrontSiteRevision: () => ({ mutate: vi.fn(), isPending: false }),
  useStorefrontSiteRevisions: () => ({ data: [], isLoading: false }),
  usePublishStorefrontPage: () => ({ mutateAsync: publishHome, isPending: false }),
  useDiscardStorefrontPageDraft: () => ({ mutateAsync: discardHome, isPending: false }),
  useStoreHomePageRow: () => ({
    home,
    themeHome: home?.hasDraft && home.draftTheme ? home : undefined,
    isLoading: false,
    ...homeLookup,
    refetch: refetchHome,
  }),
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

beforeEach(() => {
  for (const fn of [publish, discard, publishHome, discardHome, refetchHome]) fn.mockReset().mockResolvedValue({});
  home = { _id: "home", systemKey: "home", hasDraft: false, draftTheme: null, draftVersion: 2 };
  homeLookup = { isFetching: false, isError: false };
});

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

  /* Both buttons act on the home row too, so they wait for it: acting before it
     is known would publish the look and leave a theme's home behind. */
  it("waits for the home page to be checked before publishing or discarding", () => {
    homeLookup = { isFetching: true, isError: false };
    render(<SitePublishBar site={site(true)} unsavedEdits={false} />);

    expect(screen.getByRole("button", { name: "Publish changes" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Discard changes" })).toBeDisabled();
  });

  it("holds publishing when the home page could not be checked, and tries again", () => {
    homeLookup = { isFetching: false, isError: true };
    render(<SitePublishBar site={site(true)} unsavedEdits={false} />);

    expect(screen.getByRole("button", { name: "Publish changes" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn't check your home page");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetchHome).toHaveBeenCalledTimes(1);
  });

  /* Themes → Apply → "start the home page from this theme": the home page the
     theme wrote goes live, or goes away, with the look. */
  describe("with a home page a theme started", () => {
    beforeEach(() => {
      home = { _id: "home", systemKey: "home", hasDraft: true, draftTheme: "showroom", draftVersion: 3 };
    });

    it("says so, and publishes the look and then the home page", async () => {
      render(<SitePublishBar site={site(true)} unsavedEdits={false} />);

      expect(screen.getByRole("status")).toHaveTextContent("including your home page started from the Default theme");
      fireEvent.click(screen.getByRole("button", { name: "Publish changes" }));
      // With the version its row saw, so a draft edited since is refused.
      await waitFor(() => expect(publishHome).toHaveBeenCalledWith({ id: "home", draftVersion: 3 }));
      expect(publish).toHaveBeenCalledTimes(1);
      expect(publish.mock.invocationCallOrder[0]).toBeLessThan(publishHome.mock.invocationCallOrder[0]);
    });

    it("has something to publish even when the look itself is unchanged", async () => {
      render(<SitePublishBar site={site(false)} unsavedEdits={false} />);

      fireEvent.click(screen.getByRole("button", { name: "Publish changes" }));
      await waitFor(() => expect(publishHome).toHaveBeenCalledWith({ id: "home", draftVersion: 3 }));
      expect(publish).not.toHaveBeenCalled();
    });

    // The server refused it — Home was edited in another tab — so the row is
    // read again, and the bar stops naming a theme the draft no longer is.
    it("checks the home page again when its draft is refused", async () => {
      publishHome.mockRejectedValue(new Error("changed somewhere else"));
      render(<SitePublishBar site={site(true)} unsavedEdits={false} />);

      fireEvent.click(screen.getByRole("button", { name: "Publish changes" }));
      await waitFor(() => expect(refetchHome).toHaveBeenCalledTimes(1));
    });

    it("leaves the home page alone when publishing the look fails", async () => {
      publish.mockRejectedValue(new Error("refused"));
      render(<SitePublishBar site={site(true)} unsavedEdits={false} />);

      fireEvent.click(screen.getByRole("button", { name: "Publish changes" }));
      await waitFor(() => expect(publish).toHaveBeenCalled());
      expect(publishHome).not.toHaveBeenCalled();
    });

    it("discards both", async () => {
      render(<SitePublishBar site={site(true)} unsavedEdits={false} />);

      fireEvent.click(screen.getByRole("button", { name: "Discard changes" }));
      fireEvent.click(await screen.findByRole("button", { name: "Discard" }));
      await waitFor(() => expect(discardHome).toHaveBeenCalledWith({ id: "home", draftVersion: 3 }));
      expect(discard).toHaveBeenCalledTimes(1);
    });

    // An edit by hand clears `draftTheme`: that draft is the merchant's, and
    // goes live from the page editor, never swept up with the look.
    it("never publishes a home draft the merchant edited by hand", async () => {
      home = { _id: "home", systemKey: "home", hasDraft: true, draftTheme: null };
      render(<SitePublishBar site={site(true)} unsavedEdits={false} />);

      expect(screen.getByRole("status")).not.toHaveTextContent("home page");
      fireEvent.click(screen.getByRole("button", { name: "Publish changes" }));
      await waitFor(() => expect(publish).toHaveBeenCalled());
      expect(publishHome).not.toHaveBeenCalled();
    });
  });
});
