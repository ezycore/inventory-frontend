// coding-standard: maintained

/**
 * Storefront theme catalog (frontend). Mirrors the backend preset/section ids
 * (src/constants/storefront-theme.ts) and adds the visual swatch each preset
 * maps to. The merchant picks a preset and may override brand/accent colors.
 */

export interface ThemePreset {
  id: string;
  label: string;
  brandColor: string;
  accentColor: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: "default", label: "Default", brandColor: "#111827", accentColor: "#2563eb" },
  { id: "minimal", label: "Minimal", brandColor: "#0f172a", accentColor: "#64748b" },
  { id: "bold", label: "Bold", brandColor: "#dc2626", accentColor: "#f59e0b" },
  { id: "elegant", label: "Elegant", brandColor: "#4c1d95", accentColor: "#a78bfa" },
];

export const getPreset = (id?: string): ThemePreset =>
  THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS[0];

// The homepage section catalogue used to live here as `HOMEPAGE_SECTIONS` +
// `DEFAULT_HOMEPAGE_SECTIONS`, both unreferenced. It now lives in
// `lib/storefront-home-sections.ts` beside the resolver and the per-look default
// orders, so the ids, their labels and their ordering cannot drift apart.

/** Resolve the effective brand/accent colors from a theme (preset + overrides). */
export function resolveThemeColors(theme?: {
  preset?: string;
  brandColor?: string;
  accentColor?: string;
}) {
  const preset = getPreset(theme?.preset);
  return {
    brandColor: theme?.brandColor || preset.brandColor,
    accentColor: theme?.accentColor || preset.accentColor,
  };
}
