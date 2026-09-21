// coding-standard: maintained
import type { StorefrontSettings } from "@/types";
import type { StorefrontSite } from "@/types/api";

/**
 * The look blocks a switched store keeps in its Site — the backend's
 * `STOREFRONT_SITE_LOOK_KEYS`, which must move with this list.
 */
export const SITE_LOOK_KEYS = [
  "theme",
  "copy",
  "sectionConfig",
  "trustBadges",
  "heroBanner",
  "heroSlides",
  "templates",
  "nav",
  "contactButton",
] as const satisfies readonly (keyof StorefrontSettings)[];

/**
 * The settings Customize edits for a store whose look is published through the
 * Site (backend plan storefront-builder §17, Phase 5): every look block from the
 * Site's draft — or what is live when there is none — and everything else (logo,
 * contact number, the publish switch) from the settings. The shapes are the same
 * on both sides, so Customize seeds exactly as it does from the settings.
 *
 * Every look key is written, present or not: the settings still hold the look as
 * it was on the day the store switched, and a block the Site lacks must not fall
 * back to that.
 *
 * `from: "published"` takes only what shoppers see now, ignoring an unpublished
 * draft — for the screens that report the live look rather than edit it
 * (`useLiveStoreSettings`).
 */
export function settingsWithSiteLook(
  settings: StorefrontSettings,
  site: StorefrontSite | undefined,
  from: "draft" | "published" = "draft",
): StorefrontSettings {
  if (!site) return settings;
  const source = from === "published" ? site.published.look : (site.draft?.look ?? site.published.look);
  const look = source as unknown as Partial<StorefrontSettings>;
  const merged: Record<string, unknown> = { ...settings };
  for (const key of SITE_LOOK_KEYS) merged[key] = look[key];
  return merged as unknown as StorefrontSettings;
}
