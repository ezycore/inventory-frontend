// coding-standard: maintained

/**
 * The storefront's visual vocabulary — the part of a shop's look that is not
 * "which block renders" but "how everything is drawn": typeface, type scale,
 * spacing density and corner style.
 *
 * Until this existed a theme could change layout ids and two colours, so two
 * shops on different themes still shared one typeface, one heading scale, one
 * spacing rhythm and one corner radius — which is why they never looked like
 * genuinely different shops.
 *
 * Every value here resolves to CSS custom properties that `.sf-root` already
 * declares (`--font-storefront`, `--h1`/`--h1m`/`--h2`, `--pad`/`--gap`/
 * `--cols`/`--maxw`, plus the radius scale). The storefront shell writes them
 * onto the root element; nothing else changes.
 *
 * **Bengali is not optional.** Every font stack keeps `--font-noto-bengali`
 * after its Latin face — these are bilingual shops, and a stack without it
 * renders Bangla in a system fallback that does not match the Latin text.
 */

export type FontKey = "sans" | "grotesk" | "serif";
export type ScaleKey = "compact" | "normal" | "generous";
export type DensityKey = "dense" | "normal" | "airy";
export type RadiusKey = "sharp" | "soft" | "round";

export interface StoreDesign {
  font?: string;
  scale?: string;
  density?: string;
  radius?: string;
}

/**
 * Latin face per key, always followed by the Bengali companion and a system
 * fallback. The `--font-*` variables are injected by `next/font` in the
 * storefront layout, so a key with no loaded font degrades to system-ui rather
 * than breaking.
 */
const FONT_STACKS: Record<FontKey, string> = {
  sans: "var(--font-inter), var(--font-noto-bengali), ui-sans-serif, system-ui, sans-serif",
  grotesk:
    "var(--font-grotesk), var(--font-noto-bengali), ui-sans-serif, system-ui, sans-serif",
  serif:
    "var(--font-serif), var(--font-noto-bengali), ui-serif, Georgia, serif",
};

/**
 * Heading sizes at the three breakpoints `.sf-root` already defines. `h1m` is
 * the Minimal home layout's larger display size, kept in step with `h1`.
 */
const SCALES: Record<ScaleKey, { h1: number[]; h1m: number[]; h2: number[] }> = {
  compact: { h1: [26, 32, 38], h1m: [30, 38, 44], h2: [18, 20, 22] },
  normal: { h1: [30, 38, 46], h1m: [34, 44, 52], h2: [20, 23, 26] },
  generous: { h1: [34, 44, 56], h1m: [40, 52, 64], h2: [22, 26, 30] },
};

/** Page padding, grid gap, product columns and max width per breakpoint. */
const DENSITIES: Record<
  DensityKey,
  { pad: number[]; gap: number[]; cols: number[]; maxw: number }
> = {
  dense: { pad: [12, 20, 28], gap: [8, 12, 14], cols: [2, 3, 5], maxw: 1320 },
  normal: { pad: [16, 28, 40], gap: [12, 16, 16], cols: [2, 3, 4], maxw: 1200 },
  airy: { pad: [20, 36, 56], gap: [16, 24, 32], cols: [2, 2, 3], maxw: 1080 },
};

/**
 * Four steps, from the thirteen ad-hoc values the components used to hardcode.
 * `pill` stays 999px in every family — a pill is a shape decision, not a size,
 * and squaring it off turns badges into unreadable blocks.
 */
const RADII: Record<RadiusKey, { sm: number; md: number; lg: number }> = {
  sharp: { sm: 0, md: 2, lg: 4 },
  soft: { sm: 6, md: 10, lg: 14 },
  round: { sm: 10, md: 16, lg: 22 },
};

const pick = <T,>(map: Record<string, T>, key: string | undefined, fallback: T): T =>
  (key && map[key]) || fallback;

/**
 * Resolve a store's saved design keys into the CSS custom properties the
 * storefront reads. Breakpoint-varying values are emitted as three numbered
 * properties (`--t-pad-0/1/2`); `storefront.css` assigns them to the real
 * token at each media query, so the responsive behaviour stays in CSS where it
 * belongs rather than being recomputed in JS.
 *
 * An unset design resolves to the built-in defaults, so a store that has never
 * applied a template renders exactly as it does today.
 */
export function resolveDesignVars(design?: StoreDesign): Record<string, string> {
  const scale = pick(SCALES, design?.scale, SCALES.normal);
  const density = pick(DENSITIES, design?.density, DENSITIES.normal);
  const radius = pick(RADII, design?.radius, RADII.soft);
  const font = pick(FONT_STACKS, design?.font, FONT_STACKS.sans);

  const vars: Record<string, string> = {
    "--t-font": font,
    "--t-maxw": `${density.maxw}px`,
    "--t-r-sm": `${radius.sm}px`,
    "--t-r-md": `${radius.md}px`,
    "--t-r-lg": `${radius.lg}px`,
  };
  (["h1", "h1m", "h2"] as const).forEach((k) => {
    scale[k].forEach((v, i) => {
      vars[`--t-${k}-${i}`] = `${v}px`;
    });
  });
  (["pad", "gap", "cols"] as const).forEach((k) => {
    density[k].forEach((v, i) => {
      vars[`--t-${k}-${i}`] = k === "cols" ? String(v) : `${v}px`;
    });
  });
  return vars;
}

/** Merchant-facing names, for describing a template's look in the editor. */
export const DESIGN_LABELS: Record<string, string> = {
  sans: "Neutral sans",
  grotesk: "Geometric",
  serif: "Editorial serif",
  compact: "Compact type",
  normal: "Balanced type",
  generous: "Large type",
  dense: "Dense",
  airy: "Spacious",
  sharp: "Square corners",
  soft: "Soft corners",
  round: "Rounded",
};
