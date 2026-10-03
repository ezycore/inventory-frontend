// coding-standard: maintained
import { describe, expect, it } from "vitest";
import type { StorefrontSettings } from "@/types";
import type { StorefrontSite } from "@/types/api";
import { settingsWithSiteLook } from "./site-look";

const settings = {
  published: true,
  logo: { url: "https://cdn.test/logo.webp" },
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
  it("edits the draft when there is one", () => {
    const merged = settingsWithSiteLook(
      settings,
      siteWith({ copy: { footerText: "Live" } }, { copy: { footerText: "Draft" } }),
    );
    expect(merged.copy?.footerText).toBe("Draft");
  });

  it("reports only what is live when asked for the published look, draft or not", () => {
    const merged = settingsWithSiteLook(
      settings,
      siteWith({ copy: { footerText: "Live" } }, { copy: { footerText: "Draft" } }),
      "published",
    );
    expect(merged.copy?.footerText).toBe("Live");
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

  it("leaves a block the Site lacks unset", () => {
    const merged = settingsWithSiteLook(settings, siteWith({ copy: { footerText: "Live" } }));
    expect(merged.nav).toBeUndefined();
  });
});
