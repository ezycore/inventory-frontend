// coding-standard: maintained
import type { SectionFieldSpec, SectionPageContext } from "./field-specs";
import { ANCHOR_PATTERN } from "./style-specs";

/**
 * Reading a section instance's settings against its spec, for the renderer.
 *
 * The backend has already validated every saved page against the generated
 * manifest (`src/utils/storefront-section-validation.ts`), so this is not the
 * gate — it is what keeps a page rendering when the data and the code disagree:
 * a page published before a setting was narrowed, a hand-edited document, a
 * section from a newer build. The rules mirror the backend's; the difference is
 * the failure mode. The backend refuses the save, the renderer drops the value:
 *
 *  - an invalid **optional** field reads as absent;
 *  - an invalid **required** field makes the whole section unrenderable
 *    (`readSettings` returns `null`) and the page skips it — a page must never
 *    grow a half-drawn section.
 */

/**
 * A value that may differ on phones. `mobile` inherits `base` until set, and
 * `base` itself may be absent — a merchant who set a phone value on a setting
 * the desktop had never been given leaves the desktop on whatever it drew
 * before (the section's own fallback, or the Customize setting it follows).
 * Writing their phone choice into `base` instead would change the desktop page
 * they were not looking at.
 */
export interface Responsive<T> {
  base?: T;
  mobile?: T;
}

/** A section image, reduced to what a renderer may use. */
export interface SectionImage {
  url: string;
  mediumUrl?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  alt?: string;
}

/** A crop anchor in percent of the image's own box — what `focalPosition` turns into CSS. */
export interface SectionFocal {
  x: number;
  y: number;
}

type ScalarOf<S> = S extends { type: "number" }
  ? number
  : S extends { type: "boolean" }
    ? boolean
    : S extends { type: "enum"; values: readonly (infer V)[] }
      ? V
      : S extends { type: "image" }
        ? SectionImage
        : S extends { type: "focal" }
          ? SectionFocal
          : S extends { type: "refs" }
            ? string[]
            : string;

type FieldOf<S> = S extends { responsive: true } ? Responsive<ScalarOf<S>> : ScalarOf<S>;

/** Optional, or supplied by some page instead (`fromPage`) — either way it may be absent. */
type OptionalKeys<T> = {
  [K in keyof T]: T[K] extends { optional: true } | { fromPage: readonly unknown[] } ? K : never;
}[keyof T];

/**
 * The typed settings of a section, derived from its `as const` spec: required
 * settings are required keys, optional ones are optional keys — so a settings
 * object may simply leave an optional setting out.
 */
export type SettingsOf<T extends Record<string, SectionFieldSpec>> = {
  [K in Exclude<keyof T, OptionalKeys<T>>]: FieldOf<T[K]>;
} & {
  [K in OptionalKeys<T>]?: FieldOf<T[K]>;
};

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const HTTP_URL = /^https?:\/\//i;
const MAX_URL_LENGTH = 500;
const MAX_DATE_LENGTH = 40;
const MAX_ALT_LENGTH = 160;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Same allowlist as the backend: http(s), `tel:`, `mailto:` and store-relative paths. */
/** Same pattern the style box accepts as a section's `anchor`, with the `#`. */
const ANCHOR_LINK = new RegExp(ANCHOR_PATTERN.replace("^", "^#"));

export const isAllowedSectionUrl = (value: string): boolean => {
  if (value.length > MAX_URL_LENGTH || value !== value.trim()) return false;
  if (/^https?:\/\/[^\s]+$/i.test(value)) return true;
  if (/^tel:\+?[0-9 ()-]{3,20}$/i.test(value)) return true;
  if (/^mailto:[^\s@]+@[^\s@]+$/i.test(value)) return true;
  // A jump to another section of the SAME page, by the name its Style tab gives
  // it. ⚠ **This has to match the backend's `isAllowedSectionUrl` exactly.** The
  // backend saved `#order-here` happily while this reader still refused it, so
  // the section's `buttonHref` read as invalid, the required setting was missing
  // and `prepareSections` dropped the WHOLE SECTION from the page — silently,
  // because that is what it does with an instance it cannot draw. Found in the
  // browser on 2026-09-21; no test caught it, because both sides were tested
  // against themselves rather than against each other.
  if (ANCHOR_LINK.test(value)) return true;
  return /^\/(?!\/)[^\s]*$/.test(value);
};

/** An image value, or `undefined` when its main URL is not a plain http(s) link. */
export const readImage = (value: unknown): SectionImage | undefined => {
  if (!isPlainObject(value)) return undefined;
  const { url } = value;
  if (typeof url !== "string" || !HTTP_URL.test(url) || url.length > MAX_URL_LENGTH) return undefined;
  const variant = (v: unknown) => (typeof v === "string" && HTTP_URL.test(v) ? v : undefined);
  const size = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : undefined);
  return {
    url,
    mediumUrl: variant(value.mediumUrl),
    thumbnailUrl: variant(value.thumbnailUrl),
    width: size(value.width),
    height: size(value.height),
    alt: typeof value.alt === "string" ? value.alt.slice(0, MAX_ALT_LENGTH) : undefined,
  };
};

const isPercent = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;

const byteLength = (text: string) => new TextEncoder().encode(text).length;

const readScalar = (spec: SectionFieldSpec, value: unknown): unknown => {
  switch (spec.type) {
    case "string":
      if (typeof value !== "string" || value.length > spec.max) return undefined;
      return spec.min !== undefined && value.trim().length < spec.min ? undefined : value;
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
      if (spec.int && !Number.isInteger(value)) return undefined;
      return value < spec.min || value > spec.max ? undefined : value;
    case "boolean":
      return typeof value === "boolean" ? value : undefined;
    case "enum":
      return typeof value === "string" && spec.values.includes(value) ? value : undefined;
    case "url":
      return typeof value === "string" && isAllowedSectionUrl(value) ? value : undefined;
    case "color":
      return typeof value === "string" && HEX_COLOR.test(value) ? value : undefined;
    case "image":
      return readImage(value);
    case "focal":
      return isPlainObject(value) && isPercent(value.x) && isPercent(value.y)
        ? { x: value.x, y: value.y }
        : undefined;
    case "date":
      return typeof value === "string" &&
        value.length <= MAX_DATE_LENGTH &&
        !Number.isNaN(Date.parse(value))
        ? value
        : undefined;
    case "richText":
      return typeof value === "string" && byteLength(value) <= spec.maxBytes ? value : undefined;
    case "ref":
      return typeof value === "string" && OBJECT_ID.test(value) ? value : undefined;
    case "refs":
      if (!Array.isArray(value) || value.length > spec.max) return undefined;
      if (new Set(value).size !== value.length) return undefined;
      return value.every((id) => typeof id === "string" && OBJECT_ID.test(id)) ? value : undefined;
  }
};

const readField = (spec: SectionFieldSpec, value: unknown): unknown => {
  if (value === undefined || value === null) return undefined;
  if (!spec.responsive) return readScalar(spec, value);
  // A value stored BEFORE the field became responsive is the desktop's answer.
  //
  // ⚠ This is what makes responsive-izing a setting a safe change. Without it,
  // adding `responsive: true` to a field that live pages have already answered
  // refuses every one of those answers — the page renders the section's default
  // and the backend rejects the merchant's next save — and neither a `v` bump
  // nor leaving the field alone is a way out.
  //
  // Only a NON-object value is read this way. A responsive `focal` or `image`
  // stores an object as its scalar, and a bare one cannot be told apart from a
  // malformed `{ base, mobile }`; those keep the strict rule.
  if (!isPlainObject(value)) {
    const base = readScalar(spec, value);
    return base === undefined ? undefined : { base };
  }
  const base = readScalar(spec, value.base);
  // A bad phone override falls back to the desktop value rather than dropping
  // both; a phone value with no desktop one is kept, because the desktop then
  // draws the section's own fallback rather than the phone's choice.
  const mobile = readScalar(spec, value.mobile);
  if (base === undefined) return mobile === undefined ? undefined : { mobile };
  return mobile === undefined ? { base } : { base, mobile };
};

const BLOCK_ID = /^[A-Za-z0-9_-]{1,40}$/;

/**
 * A section's repeatable blocks, typed by the block spec. An invalid block —
 * bad id, repeated id, or a required setting that does not read — is skipped
 * on its own, so one broken FAQ item never hides the rest.
 */
export function readBlocks<T extends Record<string, SectionFieldSpec>>(
  specs: { max: number; settings: T } | undefined,
  raw: unknown,
  context?: SectionPageContext,
): { id: string; settings: SettingsOf<T> }[] {
  if (!specs || !Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const blocks: { id: string; settings: SettingsOf<T> }[] = [];
  for (const block of raw.slice(0, specs.max)) {
    if (!isPlainObject(block) || typeof block.id !== "string" || !BLOCK_ID.test(block.id)) continue;
    if (seen.has(block.id)) continue;
    const settings = readSettings(specs.settings, block.settings, context);
    if (!settings) continue;
    seen.add(block.id);
    blocks.push({ id: block.id, settings });
  }
  return blocks;
}

/**
 * A section's settings, typed by its spec — or `null` when a required field is
 * missing or invalid, meaning the section must not render. Keys the spec does
 * not declare are ignored.
 *
 * `context` is the page the section sits on. A field that page supplies itself
 * (`fromPage`) is not read there at all — the section takes the page's value —
 * and without a context such a field is read like any other, so a caller that
 * does not know the page is never more lenient than the backend.
 */
export function readSettings<T extends Record<string, SectionFieldSpec>>(
  specs: T,
  raw: unknown,
  context?: SectionPageContext,
): SettingsOf<T> | null {
  const source = isPlainObject(raw) ? raw : {};
  const settings: Record<string, unknown> = {};
  for (const [key, spec] of Object.entries(specs)) {
    if (context && spec.fromPage?.includes(context)) continue;
    const value = readField(spec, source[key]);
    if (value === undefined) {
      if (!spec.optional) return null;
      continue;
    }
    settings[key] = value;
  }
  return settings as SettingsOf<T>;
}
