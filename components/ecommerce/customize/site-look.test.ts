import { describe, expect, it } from "vitest";
import type { StorefrontSettings } from "@/types";
import type { StorefrontSite } from "@/types/api";
import { settingsWithSiteLook } from "./site-look";

const settings = {
  published: true,
  logo: { url: "https://cdn.test/logo.webp" },
  copy: { footerText: "Words from the day the store switched" },
  heroBanner: { title: "Stale banner" },
} as unknown as StorefrontSettings;

const siteWith = (published: object, draft?: object) =>
  ({
    _id: "site",
    organizationId: "org",
    published: { look: published, version: 2, publishedAt: "2026-09-15T00:00:00.000Z" },
    draft: draft ? { look: draft, updatedAt: "2026-09-15T00:00:00.000Z" } : null,
    draftVersion: 3,
    createdAt: "2026-09-15T00:00:00.000Z",
    updatedAt: "2026-09-15T00:00:00.000Z",
  }) as unknown as StorefrontSite;

describe("settingsWithSiteLook", () => {
  it("returns the settings untouched for a store that has not switched", () => {
    expect(settingsWithSiteLook(settings, undefined)).toBe(settings);
  });

  it("edits the draft when there is one", () => {
    const merged = settingsWithSiteLook(
      settings,
      siteWith({ copy: { footerText: "Live" } }, { copy: { footerText: "Draft" } }),
    );
    expect(merged.copy?.footerText).toBe("Draft");
  });

  it("edits what is live when there is no draft", () => {
    const merged = settingsWithSiteLook(settings, siteWith({ copy: { footerText: "Live" } }));
    expect(merged.copy?.footerText).toBe("Live");
  });

  it("keeps everything that is not the look", () => {
    const merged = settingsWithSiteLook(settings, siteWith({}));
    expect(merged.logo).toEqual({ url: "https://cdn.test/logo.webp" });
    expect(merged.published).toBe(true);
  });

  it("never falls back to the settings' stale look for a block the Site lacks", () => {
    const merged = settingsWithSiteLook(settings, siteWith({ copy: { footerText: "Live" } }));
    expect(merged.heroBanner).toBeUndefined();
  });
});
