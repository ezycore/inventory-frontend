// coding-standard: maintained
/**
 * The STYLE BOX every Storefront Builder section carries (plan §5.2
 * `SectionStyle`): background, padding, width, alignment and text tone. This
 * file is the vocabulary — which keys a section's `style` may hold and what
 * each one accepts. `section-style.ts` renders it; the backend refuses
 * everything it does not describe.
 *
 * **One source for both repos.** Until 2026-09-21 this vocabulary was
 * hand-copied: the backend's `checkStyle` named its own allowlist and carried
 * its own `SPACING_STEPS`, with nothing comparing the two — the section
 * manifest's `--check` covered sections and never reached the style box. This
 * module closes that gap. Like `field-specs.ts`, its body is copied **verbatim**
 * into the backend's generated `src/constants/storefront-section-manifest.ts`
 * (`inventory-frontend/scripts/gen-section-manifest.mjs`), so it must stay
 * self-contained: **no imports of any kind**, only erasable TypeScript, and
 * nothing that would not compile in the backend.
 *
 * Adding a key here is a spec change like any other: regenerate the manifest,
 * commit the backend file, and **ship the backend before the frontend**
 * (`inventory-frontend/docs/plan/storefront-section-controls.md` §0.5).
 */

/**
 * Vertical spacing, as steps rather than pixels so one choice reads
 * proportionately on a phone and a desktop. `section-style.ts` maps each step
 * to its `clamp()`; the CSS values are the frontend's own business and are
 * deliberately not part of this contract.
 */
export const SPACING_STEPS = ["none", "sm", "md", "lg", "xl"] as const;
export type SpacingStep = (typeof SPACING_STEPS)[number];

/** What sits behind a section: nothing, a flat colour, or a picture. */
export const BACKGROUND_KINDS = ["none", "color", "image"] as const;

/** The column a section's content sits in. */
export const SECTION_WIDTHS = ["content", "wide", "full"] as const;

/** Where the section's words sit. Responsive: the phone may answer differently. */
export const SECTION_ALIGNS = ["left", "center"] as const;

/**
 * Which way the section's text reads against its own background. `auto` leaves
 * it to the theme; the other two are the merchant overriding that judgement.
 */
export const SECTION_TONES = ["auto", "light", "dark"] as const;

interface StyleFieldBase {
  /** Stored as `{ base, mobile? }` — the mobile value inherits base until set. */
  responsive?: boolean;
}

/**
 * One style key's shape. A deliberately smaller vocabulary than
 * `SectionFieldSpec`: the style box is five keys shared by every section, not a
 * per-section design surface, and a key that needs a reference or a rich
 * document belongs in the section's own settings instead.
 */
export type StyleFieldSpec = StyleFieldBase &
  (
    | { type: "enum"; values: readonly string[] }
    | { type: "boolean" }
    | { type: "number"; min: number; max: number; int?: boolean }
    | { type: "color" }
    | { type: "string"; pattern: string; max: number }
    /** An object naming every edge, each edge a `SpacingStep` and each required. */
    | { type: "spacing"; edges: readonly string[] }
    /**
     * An object whose `kind` decides which of its other keys is read. `keys`
     * is the allowlist for those, so the validator has no hand-written list of
     * its own to keep in step.
     */
    | { type: "background"; kinds: readonly string[]; keys: readonly string[] }
  );

/**
 * Every key a section's `style` may carry. `Object.keys` of this **is** the
 * allowlist — there is deliberately no second list of key names to keep in step
 * with it, because two such lists in two repos is the defect this file exists
 * to remove.
 */
export const STYLE_BOX_SPEC = {
  background: { type: "background", kinds: BACKGROUND_KINDS, keys: ["kind", "color", "image"] },
  padding: { type: "spacing", edges: ["top", "bottom"], responsive: true },
  width: { type: "enum", values: SECTION_WIDTHS },
  align: { type: "enum", values: SECTION_ALIGNS, responsive: true },
  textTone: { type: "enum", values: SECTION_TONES },
} as const satisfies Record<string, StyleFieldSpec>;

export type StyleBoxKey = keyof typeof STYLE_BOX_SPEC;
