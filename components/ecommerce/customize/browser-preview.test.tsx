import { renderWithProviders as render, screen } from "@/tests/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PREVIEW_CLEAR_PARAM, PREVIEW_TOKEN_PARAM } from "@/lib/storefront-preview";
import type { CustomizeDraft } from "./use-customize-draft";

const setToken = vi.fn();
const mintToken = vi.fn();

// A disabled query with nothing cached is still pending, as TanStack reports it.
vi.mock("@/services/api", () => ({
  useStorefrontPreviewToken: (enabled: boolean) => {
    mintToken(enabled);
    return enabled ? { data: { token: "tok" }, isPending: false } : { data: undefined, isPending: true };
  },
}));
vi.mock("@/services/storefront/hooks", () => ({ useStoreProducts: () => ({ data: undefined }) }));
vi.mock("@/lib/storefront-preview", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/storefront-preview")>()),
  setStorefrontPreviewToken: (token: string | null) => setToken(token),
}));
vi.mock("@/lib/storefront-url", () => ({ storefrontUrl: (slug: string) => `http://${slug}.localhost:3000/shop` }));
// The frame itself is not under test: the stage stays unmeasured, so no iframe mounts.
vi.mock("./use-preview-scale", () => ({
  usePreviewScale: () => ({ hostRef: { current: null }, scale: 1, ready: false, frameHeight: 800 }),
}));
vi.mock("./use-preview-theme", () => ({
  usePreviewTheme: () => ({ theme: "light", setTheme: vi.fn(), postTheme: vi.fn() }),
}));
vi.mock("./use-preview-watchdog", () => ({
  usePreviewWatchdog: () => ({ markPosted: vi.fn(), markAcked: vi.fn() }),
}));
vi.mock("./draft-payloads", () => ({ toPreviewPayload: () => ({}) }));

import { BrowserPreview } from "./browser-preview";

/** The query the preview opens the shop with — the same one the new-tab link carries. */
function frameParams(props: { published: boolean; showPageDrafts?: boolean }) {
  render(
    <BrowserPreview
      slug="new4"
      draft={{} as CustomizeDraft}
      logo={null}
      page="home"
      onPageChange={vi.fn()}
      forceCollectionsMenu={false}
      {...props}
    />,
  );
  const href = screen.getByRole("link", { name: "Open this page in a new tab" }).getAttribute("href");
  return new URL(href!).searchParams;
}

beforeEach(() => {
  setToken.mockReset();
  mintToken.mockReset();
});

/**
 * Owner preview: a token gets an unpublished shop served at all, and draws its
 * pages from their drafts. A live shop has no use for one — until a theme has
 * started its home page, which goes live with the look and so must be seen
 * before Publish.
 */
describe("BrowserPreview owner preview", () => {
  it("opens an unpublished shop with a token", () => {
    const params = frameParams({ published: false });

    expect(mintToken).toHaveBeenLastCalledWith(true);
    expect(params.get(PREVIEW_TOKEN_PARAM)).toBe("tok");
    expect(params.has(PREVIEW_CLEAR_PARAM)).toBe(false);
    expect(setToken).toHaveBeenLastCalledWith("tok");
  });

  it("opens a live shop without one, and asks it to forget an old one", () => {
    const params = frameParams({ published: true });

    expect(mintToken).toHaveBeenLastCalledWith(false);
    expect(params.has(PREVIEW_TOKEN_PARAM)).toBe(false);
    expect(params.get(PREVIEW_CLEAR_PARAM)).toBe("1");
    expect(setToken).toHaveBeenLastCalledWith(null);
  });

  it("opens a live shop with a token while it has page drafts to show", () => {
    const params = frameParams({ published: true, showPageDrafts: true });

    expect(mintToken).toHaveBeenLastCalledWith(true);
    expect(params.get(PREVIEW_TOKEN_PARAM)).toBe("tok");
    expect(params.has(PREVIEW_CLEAR_PARAM)).toBe(false);
    expect(setToken).toHaveBeenLastCalledWith("tok");
  });
});
