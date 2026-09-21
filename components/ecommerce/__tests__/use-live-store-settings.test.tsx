// coding-standard: maintained
import { render, renderHook, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  settings: { data: undefined as unknown, isLoading: false },
  site: { data: undefined as unknown, isError: false },
  siteEnabled: [] as boolean[],
}));

vi.mock("@/services/api", () => ({
  useGetStorefrontSettings: () => api.settings,
  useStorefrontSite: (enabled: boolean) => {
    api.siteEnabled.push(enabled);
    return api.site;
  },
}));

vi.mock("@/services/stores/use-auth-store", () => ({
  useAuthStore: (select: (s: unknown) => unknown) =>
    select({ user: { organization: { industry: "ONLINE_SHOP", logo: { url: "https://cdn.test/org.webp" } } } }),
}));

import { useLiveStoreSettings } from "@/components/ecommerce/use-live-store-settings";
import { StoreLookCard } from "@/components/ecommerce/store-look-card";

/**
 * Admin screens that REPORT the look read it through `useLiveStoreSettings`. A
 * store on the builder — every store created since 2026-09-17 — keeps its look on
 * the Site, while the settings hold the copy from the day it switched: reading the
 * settings alone told a merchant who had published a theme that their shop still
 * had "no theme".
 */
const stale = { theme: { preset: "default" }, siteCutoverAt: "2026-09-17T00:00:00.000Z", published: false };
const site = (publishedTheme: object, draftTheme?: object) => ({
  published: { look: { theme: publishedTheme }, version: 2, publishedAt: "2026-09-17T01:00:00.000Z" },
  draft: draftTheme ? { look: { theme: draftTheme }, updatedAt: "2026-09-17T02:00:00.000Z" } : null,
});
const themed = { appliedThemeId: "elegant", design: { surface: "parchment" } };

describe("useLiveStoreSettings", () => {
  beforeEach(() => {
    api.settings = { data: undefined, isLoading: false };
    api.site = { data: undefined, isError: false };
    api.siteEnabled = [];
  });

  it("is the settings themselves for a store still on the classic look, and never asks for a Site", () => {
    const classic = { theme: { appliedThemeId: "classic" } };
    api.settings = { data: classic, isLoading: false };
    const { result } = renderHook(() => useLiveStoreSettings());
    expect(result.current.data).toBe(classic);
    expect(api.siteEnabled.every((enabled) => enabled === false)).toBe(true);
  });

  it("lays the Site's PUBLISHED look over the settings, ignoring an unpublished draft", () => {
    api.settings = { data: stale, isLoading: false };
    api.site = { data: site(themed, { appliedThemeId: "bold" }), isError: false };
    const { result } = renderHook(() => useLiveStoreSettings());
    expect(result.current.data?.theme?.appliedThemeId).toBe("elegant");
    expect(result.current.data?.published).toBe(false);
  });

  it("reports nothing — not the stale copy — while the Site loads, or when it fails", () => {
    api.settings = { data: stale, isLoading: false };
    const loading = renderHook(() => useLiveStoreSettings());
    expect(loading.result.current).toEqual({ data: undefined, isLoading: true });

    api.site = { data: undefined, isError: true };
    const failed = renderHook(() => useLiveStoreSettings());
    expect(failed.result.current).toEqual({ data: undefined, isLoading: false });
  });
});

describe("StoreLookCard on a store whose look lives on the Site", () => {
  beforeEach(() => {
    api.settings = { data: stale, isLoading: false };
    api.site = { data: undefined, isError: false };
  });

  it("goes away once a theme is published, though the settings' copy still says default", () => {
    api.site = { data: site(themed), isError: false };
    const { container } = render(<StoreLookCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it("still prompts while the published look is the default one", () => {
    api.site = { data: site({ preset: "default" }), isError: false };
    render(<StoreLookCard />);
    expect(screen.getByText("Your store is wearing the default look")).toBeInTheDocument();
  });
});
