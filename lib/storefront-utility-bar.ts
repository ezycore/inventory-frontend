// coding-standard: maintained

/** Stored utility-bar values are optional so existing shops need no migration. */
export interface UtilityBarConfig {
  enabled?: boolean;
  showOnDesktop?: boolean;
  showOnMobile?: boolean;
  showPhone?: boolean;
  showTrackOrder?: boolean;
  showLanguage?: boolean;
  showTheme?: boolean;
  trackOrderLabel?: string;
}

export interface ResolvedUtilityBar {
  enabled: boolean;
  showOnDesktop: boolean;
  showOnMobile: boolean;
  showPhone: boolean;
  showTrackOrder: boolean;
  showLanguage: boolean;
  showTheme: boolean;
  trackOrderLabel: string;
}

/**
 * Resolve the information strip that used to be baked into the Classic header.
 * An old Classic shop therefore keeps its desktop strip, while every other old
 * header keeps rendering exactly as it did. Once saved, the explicit merchant
 * choice is independent of header layout.
 */
export function resolveUtilityBar(
  config: UtilityBarConfig | undefined,
  headerVariant: string | undefined,
): ResolvedUtilityBar {
  /* The pair says WHERE the bar goes; whether it appears at all is `enabled`'s
     job. So "off on both" carries no meaning and falls back to the default
     placement rather than becoming a second, silent way to switch the bar off.
     Customize cannot produce it — one three-way chip picker writes both fields
     — but they validate independently server-side, so an API write can. Left
     alone it desynchronises the editor from the store: the chips would light up
     "Mobile only" while the bar rendered on neither breakpoint. */
  const nowhere =
    config?.showOnDesktop === false && config?.showOnMobile === false;
  return {
    enabled: config?.enabled ?? headerVariant === "classic",
    showOnDesktop: nowhere ? true : (config?.showOnDesktop ?? true),
    showOnMobile: nowhere ? false : (config?.showOnMobile ?? false),
    showPhone: config?.showPhone ?? true,
    showTrackOrder: config?.showTrackOrder ?? true,
    showLanguage: config?.showLanguage ?? true,
    showTheme: config?.showTheme ?? true,
    trackOrderLabel: config?.trackOrderLabel?.trim() ?? "",
  };
}

/**
 * What the desktop header anatomy still owes the shopper itself.
 *
 * The utility bar and the anatomies draw from the same small set of controls,
 * so without one answer for both they either double up — Centered and Clinical
 * carry their own language AND theme buttons — or vanish entirely, which is the
 * worse half: theme is persisted to `localStorage` and re-applied before paint,
 * so an anatomy with no switch STRANDS the shopper in whichever theme they last
 * chose, on every future visit. Classic keeps no toggles of its own beyond this
 * fallback, so for the default template "the bar is off" would otherwise mean
 * "no way back out of dark mode".
 *
 * Asked per item rather than per bar — the merchant turns the four utility
 * items on and off independently, so "the bar is showing" says nothing about
 * whether the theme switch in particular survived. Same shape, and the same
 * reasoning, as `chromeHas` in the mobile menu panel.
 *
 * Desktop only: the bar's own `showOnMobile` is a separate switch, and mobile
 * already has an unconditional fallback in the menu drawer.
 */
export function desktopHeaderNeeds(bar: ResolvedUtilityBar): {
  needsTheme: boolean;
  needsLang: boolean;
} {
  // `showTheme`/`showLanguage` imply the bar rendered: `UtilityBar` only bails
  // out when all four of its items are off, which either of these rules out.
  const shows = showsOnDesktop(bar);
  return {
    needsTheme: !(shows && bar.showTheme),
    needsLang: !(shows && bar.showLanguage),
  };
}

/**
 * Is the bar on screen at desktop width? Shared with `StoreHeader`'s render so
 * the question that decides whether to DRAW the bar and the one that decides
 * whether the anatomy keeps its own toggles cannot answer differently — which
 * would be the two-controls / no-controls bug in a subtler form.
 */
export function showsOnDesktop(bar: ResolvedUtilityBar): boolean {
  return bar.enabled && bar.showOnDesktop;
}
