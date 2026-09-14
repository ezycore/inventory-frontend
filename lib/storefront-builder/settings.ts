// coding-standard: maintained
import type { SectionFieldSpec } from "./field-specs";

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

/** A value that may differ on phones. `mobile` inherits `base` until set. */
export interface Responsive<T> {
  base: T;
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

type ScalarOf<S> = S extends { type: "number" }
  ? number
  : S extends { type: "boolean" }
    ? boolean
    : S extends { type: "enum"; values: readonly (infer V)[] }
      ? V
      : S extends { type: "image" }
        ? SectionImage
        : S extends { type: "refs" }
          ? string[]
          : string;

type FieldOf<S> = S extends { responsive: true } ? Responsive<ScalarOf<S>> : ScalarOf<S>;

/** The typed settings of a section, derived from its `as const` spec. */
export type SettingsOf<T extends Record<string, SectionFieldSpec>> = {
  [K in keyof T]: T[K] extends { optional: true } ? FieldOf<T[K]> | undefined : FieldOf<T[K]>;
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
export const isAllowedSectionUrl = (value: string): boolean => {
  if (value.length > MAX_URL_LENGTH || value !== value.trim()) return false;
  if (/^https?:\/\/[^\s]+$/i.test(value)) return true;
  if (/^tel:\+?[0-9 ()-]{3,20}$/i.test(value)) return true;
  if (/^mailto:[^\s@]+@[^\s@]+$/i.test(value)) return true;
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
  if (!isPlainObject(value)) return undefined;
  const base = readScalar(spec, value.base);
  if (base === undefined) return undefined;
  // A bad phone override falls back to the desktop value rather than dropping both.
  const mobile = readScalar(spec, value.mobile);
  return mobile === undefined ? { base } : { base, mobile };
};

/**
 * A section's settings, typed by its spec — or `null` when a required field is
 * missing or invalid, meaning the section must not render. Keys the spec does
 * not declare are ignored.
 */
export function readSettings<T extends Record<string, SectionFieldSpec>>(
  specs: T,
  raw: unknown,
): SettingsOf<T> | null {
  const source = isPlainObject(raw) ? raw : {};
  const settings: Record<string, unknown> = {};
  for (const [key, spec] of Object.entries(specs)) {
    const value = readField(spec, source[key]);
    if (value === undefined) {
      if (!spec.optional) return null;
      continue;
    }
    settings[key] = value;
  }
  return settings as SettingsOf<T>;
}
