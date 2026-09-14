// coding-standard: maintained
/**
 * The field vocabulary of Storefront Builder sections: which page contexts a
 * section may sit on, which documents a setting may reference, and the shape of
 * one setting.
 *
 * **One source for both repos.** The frontend reads these types directly; the
 * backend receives this file's body verbatim inside its generated
 * `src/constants/storefront-section-manifest.ts`
 * (`inventory-frontend/scripts/gen-section-manifest.mjs`). So this module must
 * stay self-contained: no imports of any kind, only erasable TypeScript, and
 * nothing that would not compile in the backend.
 */

/** Page contexts a section can be placed on. System pages use their `systemKey`. */
export const SECTION_PAGE_CONTEXTS = [
  "landing",
  "content",
  "home",
  "collection",
  "product",
  "search",
  "cart",
  "checkout",
  "account",
  "tracking",
  "not-found",
] as const;
export type SectionPageContext = (typeof SECTION_PAGE_CONTEXTS)[number];

/** Documents a setting may point at. Every reference is ownership-checked on save. */
export type SectionRefKind = "product" | "category" | "tag" | "campaign" | "page";

interface FieldBase {
  /** Absent (or `null`) is accepted. */
  optional?: boolean;
  /** Stored as `{ base, mobile? }` — the mobile value inherits base until set. */
  responsive?: boolean;
}

export type SectionFieldSpec = FieldBase &
  (
    | { type: "string"; max: number; min?: number }
    | { type: "number"; min: number; max: number; int?: boolean }
    | { type: "boolean" }
    | { type: "enum"; values: readonly string[] }
    | { type: "url" }
    | { type: "color" }
    | { type: "image" }
    | { type: "date" }
    | { type: "richText"; maxBytes: number }
    | { type: "ref"; to: SectionRefKind }
    | { type: "refs"; to: SectionRefKind; max: number }
  );

export interface SectionDefinition {
  /** Schema version. An instance saved at any other version is refused. */
  v: number;
  /** Where the section may be placed; `"all"` means every page context. */
  pages: readonly SectionPageContext[] | "all";
  settings: Record<string, SectionFieldSpec>;
  /** Repeatable children (FAQ items, slides, testimonials). */
  blocks?: { max: number; settings: Record<string, SectionFieldSpec> };
}

export interface SectionManifest {
  version: number;
  /** Who wrote the manifest — the generator stamps the source file here. */
  source: string;
  sections: Record<string, SectionDefinition>;
}
