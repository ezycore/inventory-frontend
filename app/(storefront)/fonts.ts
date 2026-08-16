// coding-standard: maintained
/**
 * Storefront type families — the `theme.design.font` axis.
 *
 * Six options, each a **pair**: a Latin face chained to a Bengali face chosen to
 * sit with it. The storefront is EN/BN, so a Latin-only option renders half the
 * market's copy in whatever the browser falls back to — which is the one defect
 * no typecheck, lint or test can see. `storefront.css` builds the actual stack
 * (Latin first, Bengali second) per `.sf-shell[data-font]`; this module only
 * loads the files and publishes the CSS variables.
 *
 * `market` is a pair in a second sense as well — a display face for headings and
 * a plain one for text — and is the only option where `--font-display` differs
 * from `--font-storefront`. See its block below.
 *
 * Split out of `layout.tsx` so the layout stays a layout: this list grows every
 * time a theme wants a new voice, and `next/font` calls must sit at module scope.
 *
 * **Only the default pair preloads.** `next/font` preloads every declared family
 * by default, so without `preload: false` each store would ship preload hints for
 * nine families it isn't using. Non-preloaded faces still self-host and still
 * subset — they are simply fetched when first used, which for the one family a
 * given store actually selected is immediately.
 *
 * Weights are omitted wherever the family is variable (all but Hind Siliguri);
 * passing a `weight` array there would force static instances and ship more CSS.
 */

import {
  Anek_Bangla,
  Baloo_Da_2,
  Caprasimo,
  Figtree,
  Hind_Siliguri,
  Inter,
  Lora,
  Manrope,
  Noto_Sans_Bengali,
  Noto_Serif_Bengali,
  Nunito,
  Space_Grotesk,
} from "next/font/google";

// ---- sans (default) — the storefront exactly as it has always looked ----
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const notoBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-bengali",
  display: "swap",
});

// ---- serif — editorial voice (fashion, beauty, gifts) ----
// Lora, NOT a display serif like Playfair. The storefront has no central heading
// rule — every heading is inline-styled in its component against `var(--h1)` —
// so one family drives headings AND prices, buttons and form labels alike. A
// display face set at 13px is what that would actually produce.
const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
  preload: false,
});

const notoSerifBengali = Noto_Serif_Bengali({
  subsets: ["bengali"],
  variable: "--font-noto-serif-bengali",
  display: "swap",
  preload: false,
});

// ---- grotesk — squared-off and precise (electronics, gadgets) ----
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  preload: false,
});

const anekBangla = Anek_Bangla({
  subsets: ["bengali"],
  variable: "--font-anek-bangla",
  display: "swap",
  preload: false,
});

// ---- rounded — soft and approachable (grocery, food, kids) ----
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
  preload: false,
});

const balooDa = Baloo_Da_2({
  subsets: ["bengali"],
  variable: "--font-baloo-da",
  display: "swap",
  preload: false,
});

// ---- humanist — calm and legible (pharmacy, health, services) ----
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  preload: false,
});

// ---- market — a DISPLAY face on the headings, a plain one on the text ----
// The `serif` option above says why the storefront cannot simply select a
// display family: one variable drove headings, prices, buttons and form labels
// alike, so Playfair-at-13px was the real output. `market` is the answer to that
// rather than an exception to it — `--font-display` (storefront.css) is a SECOND
// variable, applied to h1–h4 and `.sf-display` only, and it equals
// `--font-storefront` on every other option. So this is the one id where the two
// differ, and adding a third display face is a two-line change here, not a
// rethink.
//
// Caprasimo is single-weight by design (a display face has one drawing), hence
// the explicit `weight`. Its Bengali partner is Baloo Da 2 — already loaded for
// `rounded`, and the only Bengali family in the set with enough weight on the
// stroke to sit beside it rather than look like a caption.
const caprasimo = Caprasimo({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-caprasimo",
  display: "swap",
  preload: false,
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
  preload: false,
});

// The one non-variable family here, so it declares its weights explicitly.
const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hind-siliguri",
  display: "swap",
  preload: false,
});

/**
 * Every family's CSS-variable class, for the `.sf-root` element. Declaring them
 * all is what lets a merchant switch fonts without a rebuild — the variables
 * exist on every page and `data-font` picks which one `--font-storefront` reads.
 */
export const STOREFRONT_FONT_VARS = [
  inter.variable,
  notoBengali.variable,
  lora.variable,
  notoSerifBengali.variable,
  spaceGrotesk.variable,
  anekBangla.variable,
  nunito.variable,
  balooDa.variable,
  manrope.variable,
  hindSiliguri.variable,
  caprasimo.variable,
  figtree.variable,
].join(" ");
