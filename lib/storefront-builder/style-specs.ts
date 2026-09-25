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
export const SECTION_ALIGNS = ["left", "center", "right"] as const;

/**
 * Which way the section's text reads against its own background. `auto` leaves
 * it to the theme, `light` and `dark` are the merchant overriding that
 * judgement, and `custom` hands the answer to `textColor`.
 */
export const SECTION_TONES = ["auto", "light", "dark", "custom"] as const;

/**
 * How round a section's own band is. Unset keeps the section's own corners —
 * which for a full-width band means square, since a band running to the window
 * edge has no corner to round.
 */
export const SECTION_RADII = ["none", "sm", "md", "lg"] as const;

/** The darkest a background picture may be shaded, in percent. */
export const MAX_OVERLAY = 80;

/**
 * Which edges the Outline draws on. Unset is `all`, the four-sided box the
 * switch drew on its own before this existed, so no stored page moves.
 *
 * ⚠ **The left and right edges sit at the WINDOW, not around the content.** The
 * border is on `.sfb-sec`, which always spans the viewport — `width` constrains
 * `.sfb-inner` alone — so a four-sided outline reads as two hairlines glued to
 * the browser edges. `top-bottom` is what a merchant almost always means by a
 * line on a band: a rule between two sections. Inset-from-the-edge would mean
 * moving the border onto an inner element, which would restyle every page that
 * already has `border: true`; that is deliberately not offered.
 */
export const SECTION_BORDER_SIDES = ["all", "top", "bottom", "top-bottom"] as const;

/**
 * The Outline's colour, as a TONE and never a hex — the hero badge's rule
 * (`badgeTone` in `section-specs.ts`). Each tone is a theme token that resolves
 * per preset AND per dark mode in `storefront.css`, so every choice stays
 * visible on whatever ground the merchant later picks; a typed colour cannot.
 * Unset is `theme`, the `--border` hairline the switch drew on its own.
 */
export const SECTION_BORDER_TONES = ["theme", "strong", "brand", "accent", "text"] as const;

/**
 * The Outline's thickness in pixels. Whole pixels because a hairline is the
 * point of the control and a fractional one renders differently per device
 * pixel ratio; capped at 6 because past that a section is wearing a frame, and
 * the band + corners + spacing already draw that better.
 */
export const MIN_BORDER_WIDTH = 1;
export const MAX_BORDER_WIDTH = 6;

/**
 * A section's own name on the page, for a link to jump to — the move a landing
 * page is built around, and the one thing the sticky order bar could do that no
 * merchant could type. Lower case, digits and dashes, starting with a letter or
 * digit, so it is a valid HTML id and a readable URL fragment.
 */
export const ANCHOR_PATTERN = "^[a-z0-9][a-z0-9-]{0,39}$";
export const ANCHOR_MAX = 40;

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
    /**
     * An object of edges, each a `SpacingStep`. `edges` must all be present —
     * a half-written side leaves the renderer guessing which edge was meant —
     * while `optionalEdges` may be absent.
     *
     * ⚠ The split is not decoration. `inline` arrived after `top`/`bottom` had
     * been saved on live pages; requiring it would have refused every one of
     * them on its next save.
     */
    | { type: "spacing"; edges: readonly string[]; optionalEdges?: readonly string[] }
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
  padding: { type: "spacing", edges: ["top", "bottom"], optionalEdges: ["inline"], responsive: true },
  width: { type: "enum", values: SECTION_WIDTHS },
  align: { type: "enum", values: SECTION_ALIGNS, responsive: true },
  textTone: { type: "enum", values: SECTION_TONES },
  /** Read only when `textTone` is `custom`; kept otherwise, never erased. */
  textColor: { type: "color" },
  radius: { type: "enum", values: SECTION_RADII },
  /**
   * A line around the section's band. Kept a BOOLEAN, with the three keys below
   * describing it, so every page saved before them renders byte for byte: unset
   * is a 1px `--border` hairline on all four edges.
   */
  border: { type: "boolean" },
  /** Read only when `border` is on; kept otherwise, never erased. */
  borderSides: { type: "enum", values: SECTION_BORDER_SIDES },
  /** Read only when `border` is on; kept otherwise, never erased. */
  borderTone: { type: "enum", values: SECTION_BORDER_TONES },
  /** Read only when `border` is on; kept otherwise, never erased. */
  borderWidth: { type: "number", min: MIN_BORDER_WIDTH, max: MAX_BORDER_WIDTH, int: true },
  /** Percent of black over a background PICTURE. Nothing to shade without one. */
  overlay: { type: "number", min: 0, max: MAX_OVERLAY, int: true },
  anchor: { type: "string", pattern: ANCHOR_PATTERN, max: ANCHOR_MAX },
} as const satisfies Record<string, StyleFieldSpec>;

export type StyleBoxKey = keyof typeof STYLE_BOX_SPEC;
