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

/**
 * How fast the scrolling bar travels, in CHARACTERS per second.
 *
 * Characters and not pixels because the duration has to be decided on the
 * server, where nothing can be measured: a pixel pace would need the rendered
 * width of the message, and reading it after paint is what makes a ticker
 * visibly snap to a new speed on hydration. Characters are the one unit the
 * text carries with it.
 *
 * The pace a merchant actually wants is "readable", which is not the same as
 * "slow": `slow` here is roughly a careful read, `fast` is a glance at a notice
 * the shopper has probably already seen.
 */
const MARQUEE_CHARS_PER_SECOND: Record<MarqueeSpeed, number> = {
  slow: 6,
  normal: 10,
  fast: 16,
};

export type MarqueeSpeed = NonNullable<StoreAnnouncement["marqueeSpeed"]>;

/**
 * Floor seconds for one pass, PER SPEED — and the speed control's only effect
 * on a message that fits on one line.
 *
 * A short notice does not travel the width of its own words: the track is held
 * to twice the bar (`.sf-marquee-track`'s `min-width` in `storefront.css`), so
 * every message narrower than the bar covers the SAME distance, one bar width.
 * Characters per second therefore describes nothing down here, and a single
 * shared floor made the three speeds one speed: at 8s, every message up to 48
 * characters scrolled identically whether the merchant picked Slow or Fast —
 * which is exactly what a merchant reported after finding the control inert.
 *
 * The values are the same ramp the rates are, so the pace changes by roughly
 * the same feel either side of the crossover where length takes over.
 */
const MARQUEE_MIN_SECONDS: Record<MarqueeSpeed, number> = {
  slow: 16,
  normal: 10,
  fast: 6,
};

/** Merchant-facing pace names, for the editor's segmented control. */
export const MARQUEE_SPEED_LABELS: Record<MarqueeSpeed, string> = {
  slow: "Slow",
  normal: "Normal",
  fast: "Fast",
};

/**
 * Seconds for one full pass of a scrolling announcement.
 *
 * Derived from the message length so the PACE stays put as the wording
 * changes. A fixed duration would do the opposite of what this feature is for:
 * the longer the notice — which is the whole reason a merchant switches
 * scrolling on — the faster it would have to move to finish in the same time,
 * so the hardest message to read would be the one moving quickest.
 *
 * Clamped at both ends. The floor is `MARQUEE_MIN_SECONDS` — per speed, because
 * below the crossover the distance is fixed and the floor IS the pace; without
 * it a three-word notice strobes, and with one shared value the speed control
 * does nothing at all. The ceiling keeps a 200-character message (the field's
 * own maximum) from taking half a minute to come round.
 */
export function marqueeDurationSeconds(
  text: string,
  speed: MarqueeSpeed | undefined,
): number {
  const resolved = speed ?? "normal";
  const perSecond = MARQUEE_CHARS_PER_SECOND[resolved];
  return Math.round(
    Math.min(
      60,
      Math.max(MARQUEE_MIN_SECONDS[resolved], text.trim().length / perSecond),
    ),
  );
}
