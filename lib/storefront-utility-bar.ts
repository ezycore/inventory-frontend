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

/** The two breakpoints the bar is configured for, independently. */
export type Breakpoint = "desktop" | "mobile";

/**
 * What the header still owes the shopper itself at this breakpoint.
 *
 * The utility bar and the surrounding header draw from the same small set of
 * controls, so without one answer for both they either double up or vanish
 * entirely. Both halves were real: `centered` and `clinical` carry their own
 * language AND theme buttons, and the `tabs` phone template puts both in its
 * bar slots — while `classic` was left with NO desktop toggle of its own, and
 * theme is persisted to `localStorage` and re-applied before paint, so a header
 * with no switch STRANDS the shopper in whichever theme they last chose on
 * every future visit.
 *
 * Asked per item rather than per bar — the merchant turns the four utility
 * items on and off independently, so "the bar is showing" says nothing about
 * whether the theme switch in particular survived. Same shape, and the same
 * reasoning, as `chromeHas` in the mobile menu panel, which answers the
 * neighbouring question of what the drawer has to carry.
 *
 * Per breakpoint because the bar has a switch for each: a merchant can run it
 * on phones only, and the desktop anatomy must keep its own toggles when they do.
 */
export function headerNeeds(
  bar: ResolvedUtilityBar,
  at: Breakpoint,
  /**
   * Whether the shop offers each switch at all (Customize → Language & theme).
   * A switch the shop does not offer is owed by nobody — not the bar, not the
   * header, not the phone drawer — so it is answered here, the one place all
   * three already ask.
   */
  offers: { language: boolean; theme: boolean } = { language: true, theme: true },
): { needsTheme: boolean; needsLang: boolean } {
  // `showTheme`/`showLanguage` imply the bar rendered: `UtilityBar` only bails
  // out when all four of its items are off, which either of these rules out.
  const shows = showsOn(bar, at);
  return {
    needsTheme: offers.theme && !(shows && bar.showTheme),
    needsLang: offers.language && !(shows && bar.showLanguage),
  };
}

/**
 * Is the bar on screen at this width? Shared with the render so the question
 * that decides whether to DRAW the bar and the one that decides whether the
 * header keeps its own toggles cannot answer differently — which would be the
 * two-controls / no-controls bug in a subtler form.
 */
export function showsOn(bar: ResolvedUtilityBar, at: Breakpoint): boolean {
  return bar.enabled && (at === "desktop" ? bar.showOnDesktop : bar.showOnMobile);
}
