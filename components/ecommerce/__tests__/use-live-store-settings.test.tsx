// coding-standard: maintained
import { render, renderHook, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  settings: { data: undefined as unknown, isLoading: false },
  site: { data: undefined as unknown, isLoading: false },
}));

vi.mock("@/services/api", () => ({
  useGetStorefrontSettings: () => api.settings,
  useStorefrontSite: () => api.site,
}));

vi.mock("@/services/stores/use-auth-store", () => ({
  useAuthStore: (select: (s: unknown) => unknown) =>
    select({ user: { organization: { industry: "ONLINE_SHOP", logo: { url: "https://cdn.test/org.webp" } } } }),
}));

import { useLiveStoreSettings } from "@/components/ecommerce/use-live-store-settings";
import { StoreLookCard } from "@/components/ecommerce/store-look-card";

/**
 * Admin screens that REPORT the look read it through `useLiveStoreSettings`,
 * which lays the Site's published look over the store settings.
 */
const settings = { published: false };
const site = (publishedTheme: object, draftTheme?: object) => ({
  published: { look: { theme: publishedTheme }, version: 2, publishedAt: "2026-09-17T01:00:00.000Z" },
  draft: draftTheme ? { look: { theme: draftTheme }, updatedAt: "2026-09-17T02:00:00.000Z" } : null,
});
const themed = { appliedThemeId: "elegant", design: { surface: "parchment" } };

describe("useLiveStoreSettings", () => {
  beforeEach(() => {
    api.settings = { data: undefined, isLoading: false };
    api.site = { data: undefined, isLoading: false };
      });

  it("lays the Site's PUBLISHED look over the settings, ignoring an unpublished draft", () => {
    api.settings = { data: settings, isLoading: false };
    api.site = { data: site(themed, { appliedThemeId: "bold" }), isLoading: false };
    const { result } = renderHook(() => useLiveStoreSettings());
    expect(result.current.data?.theme?.appliedThemeId).toBe("elegant");
    expect(result.current.data?.published).toBe(false);
  });

  it("reports nothing while the Site loads, or when it fails", () => {
    api.settings = { data: settings, isLoading: false };
    api.site = { data: undefined, isLoading: true };
    const loading = renderHook(() => useLiveStoreSettings());
    expect(loading.result.current).toEqual({ data: undefined, isLoading: true });

    api.site = { data: undefined, isLoading: false };
    const failed = renderHook(() => useLiveStoreSettings());
    expect(failed.result.current).toEqual({ data: undefined, isLoading: false });
  });
});

describe("StoreLookCard on a store whose look lives on the Site", () => {
  beforeEach(() => {
    api.settings = { data: settings, isLoading: false };
    api.site = { data: undefined, isLoading: false };
  });

  it("goes away once a theme is published", () => {
    api.site = { data: site(themed), isLoading: false };
    const { container } = render(<StoreLookCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it("still prompts while the published look is the default one", () => {
    api.site = { data: site({ preset: "default" }), isLoading: false };
    render(<StoreLookCard />);
    expect(screen.getByText("Your store is wearing the default look")).toBeInTheDocument();
  });
});
