// coding-standard: maintained
import type {
  StoreAnnouncement,
  StoreCampaignStrip,
  StoreStripSpace,
} from "@/lib/storefront-client";
import { readableTextOn } from "@/lib/color-contrast";

/**
 * Presentation resolution for the two site-wide strips — the announcement bar
 * above the header and the live-campaign strip below it.
 *
 * One module because the two share a vocabulary (per-breakpoint visibility,
 * a size scale, spacing presets) and a merchant meets them side by side in
 * Customize. Splitting the tables would let the strips drift into disagreeing
 * about what "Roomy" means, which is exactly the kind of difference nobody
 * notices until a store looks wrong.
 *
 * **Every default here reproduces the hard-coded values these strips shipped
 * with**, so a stored document that predates the settings renders identically.
 */

/**
 * Padding shorthand for a strip, honouring the dismiss-button floor.
 *
 * The floor cannot live on `--strip-pad-x` itself — a custom property that
 * references itself is invalid at computed-value time — so it is applied where
 * the value is USED, which is also the only place that knows whether this strip
 * has a button to clear.
 */
export const stripPaddingInline = (dismissible: boolean): string =>
  dismissible
    ? "max(var(--strip-pad-x), var(--strip-dismiss-pad))"
    : "var(--strip-pad-x)";

/** Vertical padding. Constant either way; named for symmetry with the above. */
export const STRIP_PADDING_BLOCK = "var(--strip-pad-y)";

/** Text size token. Both strips read the same name; the CSS scales per strip. */
export const STRIP_FONT_SIZE = "var(--strip-font)";

/** Merchant-facing preset names, shared by both strips' editors. */
export const STRIP_SPACE_LABELS: Record<StoreStripSpace, string> = {
  sm: "Tight",
  md: "Normal",
  lg: "Roomy",
};

export const STRIP_SIZE_LABELS: Record<"sm" | "md" | "lg", string> = {
  sm: "Small",
  md: "Medium",
  lg: "Large",
};

/**
 * Per-breakpoint visibility as a CLASS, never a `matchMedia` check.
 *
 * The storefront is server-rendered and the server cannot know the viewport, so
 * a JS check renders the wrong state first and corrects it after hydration —
 * a strip that visibly flashes in and out on every page load. A CSS class is
 * decided by the browser before first paint.
 *
 * Reuses the storefront's OWN `sf-desktop-only` / `sf-mobile-only` pair rather
 * than a new one: they already carry `display: none !important` (needed here,
 * because both strips set `display` inline and an inline declaration outranks a
 * plain class), and they already sit on the 680px line the bottom nav switches
 * at — which is what actually makes a viewport "a phone" in this app. A second
 * breakpoint for the same question is how a strip ends up visible in the same
 * 40px window where the tab bar appears.
 *
 * Returns `undefined` when the strip shows everywhere, so the common case adds
 * no class at all.
 */
export function stripVisibilityClass(
  showOnDesktop: boolean | undefined,
  showOnMobile: boolean | undefined,
): string | undefined {
  const desktop = showOnDesktop ?? true;
  const mobile = showOnMobile ?? true;
  if (desktop && mobile) return undefined;
  // Both off is a real, reachable state (two switches, no cross-validation), so
  // it gets its own class instead of falling through to "shows everywhere".
  if (!desktop && !mobile) return "sf-strip-hidden";
  return desktop ? "sf-desktop-only" : "sf-mobile-only";
}

/** True when the merchant has switched the strip off on both breakpoints. */
export function isStripHiddenEverywhere(
  showOnDesktop: boolean | undefined,
  showOnMobile: boolean | undefined,
): boolean {
  return !(showOnDesktop ?? true) && !(showOnMobile ?? true);
}

export interface ResolvedStrip {
  background: string;
  color: string;
  /** Visibility class, or `undefined` when it shows on every breakpoint. */
  visibilityClass: string | undefined;
  dismissible: boolean;
  /**
   * `data-*` attributes the CSS resolves into `--strip-*` tokens.
   *
   * Attributes rather than inline `style` vars, and the distinction is
   * load-bearing: the tokens are redefined in media queries, and an inline
   * declaration outranks every one of them — which is exactly how these strips
   * came to wear desktop spacing on a phone. Same mechanism as the shell's
   * `data-density`.
   */
  attrs: {
    "data-sf-strip": "campaign" | "announcement";
    "data-strip-size": "sm" | "md" | "lg";
    "data-strip-pad-y"?: StoreStripSpace;
    "data-strip-pad-x"?: StoreStripSpace;
  };
}

/**
 * The campaign strip's concrete presentation.
 *
 * Blank colours fall through to the theme's CSS variables rather than a literal
 * — the strip has always painted itself from `--primary-soft`/`--primary`, so
 * an untouched store keeps following its theme instead of freezing today's
 * resolved value. A merchant who sets ONLY a background gets auto-contrasting
 * text, the same rule the announcement bar uses.
 *
 * Sizes and spacing are NOT resolved here — they leave as `data-*` attributes
 * for the stylesheet, so one preset means one thing per breakpoint.
 */
export function resolveCampaignStrip(
  config: StoreCampaignStrip | undefined,
): ResolvedStrip {
  const bg = config?.bgColor?.trim();
  const fg = config?.textColor?.trim();
  return {
    background: bg || "var(--primary-soft)",
    color: fg || (bg ? readableTextOn(bg) : "var(--primary)"),
    visibilityClass: stripVisibilityClass(
      config?.showOnDesktop,
      config?.showOnMobile,
    ),
    dismissible: config?.dismissible ?? false,
    attrs: {
      "data-sf-strip": "campaign",
      "data-strip-size": config?.size ?? "sm",
      "data-strip-pad-y": config?.paddingY ?? "md",
      "data-strip-pad-x": config?.paddingX ?? "md",
    },
  };
}

/**
 * Should the campaign strip render on this page at all?
 *
 * Note what this does NOT decide: whether a campaign is running. That is the
 * campaign's own start/end window, applied server-side before the strip ever
 * sees a list — so a strip with `enabled: true` and every breakpoint on still
 * renders nothing once the sale ends.
 */
export function campaignStripAllowedOn(
  config: StoreCampaignStrip | undefined,
  isHome: boolean,
): boolean {
  if (config?.enabled === false) return false;
  return (config?.showOn ?? "all") === "all" || isHome;
}

/** The announcement bar's visibility class — same rules, its own two fields. */
export function announcementVisibilityClass(
  announcement: StoreAnnouncement | undefined,
): string | undefined {
  return stripVisibilityClass(
    announcement?.showOnDesktop,
    announcement?.showOnMobile,
  );
}

/**
 * The announcement bar's token attributes.
 *
 * One `size` axis, not three: the bar couples its text size and its height into
 * a single control, and it keeps its own scale so an existing bar renders
 * unchanged on desktop.
 */
export function announcementStripAttrs(
  size: StoreAnnouncement["size"],
): ResolvedStrip["attrs"] {
  return {
    "data-sf-strip": "announcement",
    "data-strip-size": size ?? "sm",
  };
}
