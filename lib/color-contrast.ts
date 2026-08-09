// coding-standard: maintained

/**
 * Colour helpers for merchant-chosen colours (announcement bars, brand
 * primaries): WCAG-luminance-based readable text, and a dark-theme lift so a
 * dark brand never disappears against the dark storefront. Only hex colours
 * can be parsed statically — anything else passes through unchanged.
 */

type Rgb = [number, number, number];

function parseHex(color: string): Rgb | null {
  const hex = color.trim().replace(/^#/, "");
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as Rgb;
}

/** WCAG relative luminance (0 = black, 1 = white). */
function relativeLuminance([r, g, b]: Rgb): number {
  const [lr, lg, lb] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

/** Pick a readable foreground (near-black or white) for an arbitrary background. */
export function readableTextOn(bg: string, fallback = "#ffffff"): string {
  const rgb = parseHex(bg);
  if (!rgb) return fallback;
  // Above ~0.3 white text drops under 3:1 contrast — switch to near-black.
  return relativeLuminance(rgb) > 0.3 ? "#111827" : "#ffffff";
}

/**
 * Brand colours picked against a light page can vanish on the dark theme
 * (e.g. navy on near-black). Below a luminance floor, lift the colour to a
 * fixed HSL lightness — hue and saturation are kept, so it still reads as the
 * brand. (Floor 0.17 ≈ the gap between Tailwind's blue-600, used on light,
 * and blue-500, used on dark.)
 */
export function brightenForDark(color: string): string {
  const rgb = parseHex(color);
  if (!rgb || relativeLuminance(rgb) >= 0.17) return color;
  const [h, s] = rgbToHsl(rgb);
  return rgbToHex(hslToRgb(h, s, 60));
}

/** [hue 0-360, saturation 0-100] of an RGB colour (lightness is re-imposed). */
function rgbToHsl([r, g, b]: Rgb): [number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  if (d === 0) return [0, 0];
  const l = (max + min) / 2;
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return [h, Math.round(s * 100)];
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return [r, g, b].map((v) => Math.round((v + m) * 255)) as Rgb;
}

function rgbToHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
