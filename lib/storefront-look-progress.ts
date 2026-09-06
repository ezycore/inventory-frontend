// coding-standard: maintained
/**
 * Has this shop been given a look, or is it still wearing the default one?
 *
 * Three questions, asked in two places — the Start here block at the top of
 * Customize → Look, and the nudge on the store dashboard — which is exactly why
 * they are answered here rather than twice. Two copies of "does this shop have a
 * palette?" that disagree would show a merchant a prompt for something they had
 * already done, which is worse than showing no prompt at all.
 *
 * **The numbers behind the three.** Across all 43 storefronts, two had applied a
 * theme, two had a logo, and five had touched any design axis. There are no live
 * merchants yet, so that is not preference data — it is what the product
 * produces when nobody makes an effort, and it is what a real merchant will see
 * on day one: a shop identical to every other EzyCore shop.
 */

import { DEFAULT_DESIGN } from "@/lib/storefront-theme";

export interface LookProgress {
  /** A ready-made theme has been applied at some point. */
  theme: boolean;
  /** The store has a mark — its own, or the organization's. */
  logo: boolean;
  /** A ground was chosen, by the merchant or by the theme they applied. */
  palette: boolean;
  /** All three. Both surfaces hide themselves on this. */
  done: boolean;
}

export function lookProgress(input: {
  appliedThemeId?: string | null;
  surface?: string;
  hasLogo: boolean;
}): LookProgress {
  const theme = !!input.appliedThemeId;
  /* Applying a theme picks a ground as part of picking a look, so it answers
     this too. Left on the built-in white with no theme applied is the state
     being reported — not a merchant's decision to use white, but the absence of
     a decision. A merchant who genuinely wants Clean white reaches it through
     Classic, which counts. */
  const palette = theme || (!!input.surface && input.surface !== DEFAULT_DESIGN.surface);
  const logo = input.hasLogo;
  return { theme, logo, palette, done: theme && logo && palette };
}
