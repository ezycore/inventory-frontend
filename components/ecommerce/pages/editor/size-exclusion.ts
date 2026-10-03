// coding-standard: maintained
import type { SectionFieldSpec } from "@/lib/storefront-builder/field-specs";
import { hasPhoneValue, withFieldValue, type EditorDevice } from "./section-instances";

type Settings = Record<string, unknown>;

/**
 * Settings that size the same box two ways, per section: picking one clears the
 * other ON THE SAME SCREEN. The hero's stylesheet already lets a height replace
 * the shape (`storefront.css`, "Height"), so with both stored the shape was
 * silently ignored while the editor still showed it picked.
 */
const RIVALS: Record<string, Record<string, string>> = {
  hero: { frame: "height", height: "frame" },
};

const NAMES: Record<string, string> = { frame: "Hero shape", height: "Hero height" };

/** True when `device` has a value of its OWN for the field — not one it follows from the desktop. */
const ownValue = (settings: Settings, key: string, spec: SectionFieldSpec, device: EditorDevice): boolean => {
  const value = settings[key];
  if (!spec.responsive) return value !== undefined;
  if (device === "mobile") return hasPhoneValue(settings, key, spec);
  return typeof value === "object" && value !== null && (value as { base?: unknown }).base !== undefined;
};

/**
 * `settings` with `key` cleared for one screen only. Not `withFieldValue(…,
 * undefined, "desktop")`: that drops the whole key, the phone's own value with
 * it, and a desktop shape must not wipe a height the merchant gave the phone.
 */
function clearForScreen(settings: Settings, key: string, spec: SectionFieldSpec, device: EditorDevice): Settings {
  if (device === "mobile" || !spec.responsive) return withFieldValue(settings, key, spec, undefined, device);
  const mobile = (settings[key] as { mobile?: unknown } | undefined)?.mobile;
  const next = { ...settings };
  if (mobile === undefined) delete next[key];
  else next[key] = { mobile };
  return next;
}

/**
 * `next` (the settings after an edit to `key`) with the rival field cleared for
 * `device`, plus a sentence for the merchant when something was cleared.
 *
 * Only a value is cleared, never a blank: emptying the shape leaves the height
 * alone. On the phone, clearing means the phone follows the desktop again — the
 * same thing "Reset to desktop" does.
 */
export function clearRivalSize(
  sectionType: string | undefined,
  key: string,
  next: Settings,
  specs: Record<string, SectionFieldSpec>,
  device: EditorDevice,
): { settings: Settings; cleared?: string } {
  const rival = sectionType ? RIVALS[sectionType]?.[key] : undefined;
  const rivalSpec = rival ? specs[rival] : undefined;
  const keySpec = specs[key];
  if (!rival || !rivalSpec || !keySpec || !ownValue(next, key, keySpec, device)) return { settings: next };
  if (!ownValue(next, rival, rivalSpec, device)) return { settings: next };
  const screen = device === "mobile" ? "phones" : "desktop";
  return {
    settings: clearForScreen(next, rival, rivalSpec, device),
    cleared: `${NAMES[rival] ?? rival} cleared on ${screen} — ${NAMES[key] ?? key} now sets the size.`,
  };
}

/**
 * Why a picked shape does nothing on phones: the phone has a shape of its own
 * but follows the desktop's height, which replaces it. Clearing the desktop
 * height from the phone tab would change the desktop, so this is said, not done.
 */
export function inheritedRivalNote(
  sectionType: string | undefined,
  key: string,
  settings: Settings,
  specs: Record<string, SectionFieldSpec>,
  device: EditorDevice,
): string | undefined {
  if (device !== "mobile" || sectionType !== "hero" || key !== "frame") return undefined;
  const frameSpec = specs.frame;
  const heightSpec = specs.height;
  if (!frameSpec || !heightSpec) return undefined;
  if (!ownValue(settings, "frame", frameSpec, "mobile") || ownValue(settings, "height", heightSpec, "mobile")) {
    return undefined;
  }
  const height = (settings.height as { base?: unknown } | undefined)?.base;
  if (typeof height !== "number") return undefined;
  return `Phones follow the desktop height (${height}px), which replaces this shape. Set a phone height, or clear the desktop height, for the shape to apply.`;
}
