// coding-standard: maintained
import type { StorefrontLook, StorefrontSettings, StorefrontWithLook } from "@/types";
import type { StorefrontSite } from "@/types/api";

/**
 * The look blocks a store's Site holds — the backend's `STOREFRONT_SITE_LOOK_KEYS`,
 * which must move with this list.
 */
export const SITE_LOOK_KEYS = [
  "theme",
  "copy",
  "trustBadges",
  "templates",
  "nav",
  "contactButton",
] as const satisfies readonly (keyof StorefrontLook)[];

/**
 * The settings with the store's look laid over them: every look block from the
 * Site's draft — or what is live when there is none — and everything else (logo,
 * contact number, the publish switch) from the settings.
 *
 * `from: "published"` takes only what shoppers see now, ignoring an unpublished
 * draft — for the screens that report the live look rather than edit it
 * (`useLiveStoreSettings`).
 */
export function settingsWithSiteLook(
  settings: StorefrontSettings,
  site: StorefrontSite,
  from: "draft" | "published" = "draft",
): StorefrontWithLook {
  const source = from === "published" ? site.published.look : (site.draft?.look ?? site.published.look);
  const look = source as unknown as StorefrontLook;
  const merged: Record<string, unknown> = { ...settings };
  for (const key of SITE_LOOK_KEYS) merged[key] = look[key];
  return merged as unknown as StorefrontWithLook;
}
