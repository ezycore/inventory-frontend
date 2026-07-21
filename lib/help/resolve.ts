// coding-standard: maintained
/**
 * Maps the screen someone is looking at to the help page that documents it, in their language.
 *
 * The route mapping is declared in each page's `covers_routes` frontmatter and baked into
 * `content.generated.ts`, so it is the same list `pnpm help:verify` checks for phantom routes —
 * there is no second copy here to fall out of step.
 *
 * Locale falls back to English per page, not per site: a reader on Bangla gets Bangla for every
 * page that has been translated and English for the rest. Falling back wholesale would hide
 * finished translations, and failing outright would leave a shopkeeper mid-task with nothing.
 */
import {
  helpPagesByLocale,
  type HelpLocale,
  type HelpPage,
} from "./content.generated";

export type { HelpPage, HelpLocale };

const SOURCE_LOCALE: HelpLocale = "en";

export function isHelpLocale(value: string): value is HelpLocale {
  return value in helpPagesByLocale;
}

/** The locale's pages, with English standing in for anything it has not translated yet. */
export function helpPagesFor(locale: HelpLocale): HelpPage[] {
  const source = helpPagesByLocale[SOURCE_LOCALE];
  if (locale === SOURCE_LOCALE) return source;

  const translated = new Map(helpPagesByLocale[locale].map((page) => [page.slug, page]));
  return source
    .map((page) => translated.get(page.slug) ?? page)
    .sort((a, b) => a.order - b.order);
}

export function getHelpPage(slug: string, locale: HelpLocale): HelpPage | undefined {
  return helpPagesFor(locale).find((page) => page.slug === slug);
}

/** Every slug that exists, for static generation. Source locale is authoritative. */
export function helpSlugs(): string[] {
  return helpPagesByLocale[SOURCE_LOCALE].map((page) => page.slug);
}

/**
 * The help page covering `pathname`, or `undefined` when nothing documents it yet.
 *
 * Matching is longest-prefix so detail routes inherit their list page's help (`/purchases/orders/42`
 * → the page covering `/purchases/orders`), while a more specific page still wins over a broader one
 * (`/inventory/adjust` beats `/inventory`). Routes are locale-independent, so this always resolves
 * against the source locale and then hands back the reader's translation of it.
 */
export function findHelpForPath(pathname: string, locale: HelpLocale): HelpPage | undefined {
  const path = pathname.replace(/\/+$/, "") || "/";
  let best: { slug: string; length: number } | undefined;

  for (const page of helpPagesByLocale[SOURCE_LOCALE]) {
    for (const route of page.coversRoutes) {
      const matches = path === route || path.startsWith(`${route}/`);
      if (matches && (!best || route.length > best.length)) {
        best = { slug: page.slug, length: route.length };
      }
    }
  }
  return best ? getHelpPage(best.slug, locale) : undefined;
}
