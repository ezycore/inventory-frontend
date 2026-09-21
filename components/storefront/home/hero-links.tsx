// coding-standard: maintained
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { merchantLinkHref } from "@/lib/storefront-links";

const EXTERNAL = /^https?:\/\//i;
const NEW_TAB = { target: "_blank", rel: "noopener noreferrer" } as const;

/**
 * The hero's links, in a module of their own so a server component can render
 * them without loading `home-shared.tsx` (and the product card it imports).
 * Shared by the home heroes, the carousel and the Storefront Builder's hero.
 */

/**
 * One hero CTA — an owner-entered link is a store path (rides `base`), a full
 * URL (opens a new tab) or a `tel:` / `mailto:` link; empty falls back to the
 * products collection. Shared by the static hero buttons and the carousel slide
 * CTA.
 */
export function HeroCtaLink({
  base,
  link,
  style,
  children,
}: {
  base: string;
  link?: string;
  style: CSSProperties;
  children: ReactNode;
}) {
  const target = merchantLinkHref(base, link);
  if (target.startsWith("/")) {
    return (
      <Link href={target} style={style}>
        {children}
      </Link>
    );
  }
  return (
    <a href={target} style={style} {...(EXTERNAL.test(target) ? NEW_TAB : {})}>
      {children}
    </a>
  );
}

/**
 * The slide's destination when it has one but no button to hang it on.
 *
 * A merchant who fills **Link** and leaves **Button label** empty used to get a
 * slide that stored a URL and did nothing: both heroes gated the link behind the
 * label, and on a picture-only slide the whole copy block — CTA included — was
 * never rendered at all. So the link falls back from the button to the slide.
 *
 * **Rendered only when there is no button label.** With one, the button is the
 * single target and the photo stays inert, which is the merchant's own rule: two
 * overlapping hit areas on the same slide is a worse answer than one.
 *
 * **`data-hero-slide-link` is load-bearing, not a hook for styling.**
 * `useHeroRotation` skips starting a swipe on interactive descendants so a press
 * on a dot or CTA is not stolen by the carousel — and this element matches that
 * selector while covering the entire slide, which would have disabled swipe
 * outright. The attribute is how the hook tells "a control the shopper aimed at"
 * from "the slide itself, wearing an anchor".
 *
 * An empty `link` must not reach `merchantLinkHref`: its fallback is `/products`,
 * so a slide with no destination would quietly become a link to the catalogue.
 */
export function HeroSlideLink({
  base,
  link,
  label,
  reachable = true,
}: {
  base: string;
  link?: string;
  /** Accessible name — a picture-only slide has no text to borrow one from. */
  label: string;
  /**
   * False on a slide that is in the DOM but not showing. The carousel keeps
   * every slide mounted for the crossfade and marks the hidden ones
   * `aria-hidden`, and `pointer-events: none` does not remove a link from the
   * tab order — so without this a keyboard shopper tabs through one invisible
   * full-slide link per slide before reaching the page.
   */
  reachable?: boolean;
}) {
  if (!link?.trim()) return null;
  const target = merchantLinkHref(base, link);
  const shared = {
    className: "sf-hero-slide-link",
    "data-hero-slide-link": "",
    "aria-label": label,
    tabIndex: reachable ? undefined : -1,
    // An anchor is draggable by default, so a mouse drag across a link the size
    // of the hero starts a native link-drag with its ghost image instead of
    // reading as a press on the photograph.
    draggable: false,
  };
  if (target.startsWith("/")) return <Link href={target} {...shared} />;
  return <a href={target} {...(EXTERNAL.test(target) ? NEW_TAB : {})} {...shared} />;
}
