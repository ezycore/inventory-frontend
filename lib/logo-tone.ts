// coding-standard: maintained
/**
 * What tone is a store logo *drawn in*?
 *
 * A merchant's logo is often an SVG or PNG wordmark with no backdrop of its own
 * — just letterforms in one colour. The storefront has two backdrops, and
 * nothing in the store payload or the file name says which one the mark was
 * designed for, so black type disappears on the dark theme and white type
 * disappears on the light one. Neither the upload nor the theme toggle can be
 * blamed; the image simply has to be measured.
 *
 * So the pixels are asked directly: draw the logo to an off-screen canvas,
 * average the luminance of everything that is not transparent, and report which
 * backdrop it needs. `null` means "leave it alone" and covers every case where
 * guessing would do harm — a logo carrying its own background, a mid-tone or
 * multi-colour mark that reads on both themes, and any file the browser will
 * not let us sample.
 *
 * Consumed through `hooks/use-logo-tone.ts`; the only renderer is
 * `components/storefront/logo-mark.tsx`.
 */
import { relativeLuminance } from "@/lib/color-contrast";

/** `"dark"` = dark ink, needs a light backdrop. `"light"` = the reverse. */
export type LogoTone = "dark" | "light" | null;

/** Sample grid. Enough to characterise a wordmark, cheap enough to be free. */
const SAMPLE = 64;
/** Below this alpha a pixel is backdrop, not ink. */
const INK_ALPHA = 24;
/** Fewer transparent pixels than this and the logo carries its own backdrop —
 *  whatever contrast it has is already baked in and none of our business. */
const MIN_TRANSPARENT = 0.15;
/** Luminance bands that commit to a tone. The wide middle is deliberate: a
 *  brand red or teal reads on both themes, and plating it would be a downgrade. */
const DARK_INK = 0.3;
const LIGHT_INK = 0.6;

/** One result per URL — the header and footer render the same logo, and a
 *  storefront re-renders on every filter tap. */
const cache = new Map<string, LogoTone>();

export async function analyzeLogoTone(src: string): Promise<LogoTone> {
  const cached = cache.get(src);
  if (cached !== undefined) return cached;
  const tone = await measure(src).catch(() => null);
  cache.set(src, tone);
  return tone;
}

async function measure(src: string): Promise<LogoTone> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE;
  canvas.height = SAMPLE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  // Stretched to fill the grid on purpose — aspect ratio is irrelevant to a
  // colour average, and letterboxing would pad the sample with fake
  // transparent pixels and inflate the transparency ratio.
  ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
  const { data } = ctx.getImageData(0, 0, SAMPLE, SAMPLE);

  let inkWeight = 0;
  let inkLuminance = 0;
  let transparent = 0;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < INK_ALPHA) {
      transparent++;
      continue;
    }
    // Weighted by alpha so antialiased edges count for what they show, not as
    // full-strength ink — a thin wordmark is mostly edge.
    const weight = alpha / 255;
    inkWeight += weight;
    inkLuminance +=
      relativeLuminance([data[i], data[i + 1], data[i + 2]]) * weight;
  }

  const pixels = data.length / 4;
  if (inkWeight === 0) return null;
  if (transparent / pixels < MIN_TRANSPARENT) return null;

  const luminance = inkLuminance / inkWeight;
  if (luminance <= DARK_INK) return "dark";
  if (luminance >= LIGHT_INK) return "light";
  return null;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Required, and the reason this can fail benignly: without it the canvas is
    // tainted and `getImageData` throws for every remotely hosted logo, which is
    // all of them. With it, a host that refuses CORS fails the *load* instead —
    // either way the caller gets `null` and renders the logo exactly as before.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`logo sample failed: ${src}`));
    img.src = src;
  });
}
