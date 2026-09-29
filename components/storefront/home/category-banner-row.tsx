// coding-standard: maintained
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import type { CatalogCategory, StoreSectionConfig } from "@/lib/storefront-client";
import { collectionHref, storeLinkHref } from "@/lib/storefront-links";
import { cardImageUrl } from "@/lib/storefront-image";
import {
  cardRatioValue,
  cardSplitValue,
  resolveBannerLayout,
  resolveCardRadius,
  resolveCardRatio,
  sectionCard,
} from "@/lib/storefront-sections";
import { Media } from "@/components/storefront/sf-bits";
import type { StripRenderer } from "@/components/storefront/home/category-row-layout";
import { brandButton } from "@/lib/storefront-button";

/**
 * The promo-card settings the row reads: a Storefront Builder section's
 * settings mapped onto these names.
 */
export type BannerRowConfig = Pick<
  StoreSectionConfig,
  | "cardShape"
  | "cardSide"
  | "cardSplit"
  | "cardHideText"
  | "cardHeight"
  | "cardFlow"
  | "cardPerRow"
  | "cardRatio"
  | "cardRadius"
  | "cardArrows"
  | "showCta"
  | "cards"
  | "mobile"
>;

/**
 * Category promo cards — one to four departments advertised as a block, each
 * with its photograph, its name, the merchant's own line about it, and a button
 * into it. Pure markup shared by the home page's `CategoryBanners` and the
 * Storefront Builder's promo-cards section; the caller picks the collections and
 * brings the scrolling track (`renderStrip`).
 *
 * **How this differs from `category-tiles`, which is the question to answer
 * before touching either.** Tiles are WAYFINDING: every department, small,
 * scannable, sized so a row of them never outweighs the products. These are
 * MERCHANDISING: a handful the merchant chose, drawn large enough to sell. That
 * is why the count is capped at four and why the collections are picked rather
 * than listed — a promo block showing all fourteen departments is a tile row
 * with the type turned up.
 *
 * It is also why the description earns its place here and is suppressed on most
 * tile modes: a card this size has room for a sentence, and the sentence is what
 * makes it an advertisement rather than a link.
 *
 * **On a phone it is one card per row, full width** — not two half-width ones.
 * The whole point of the block is that a card is big enough to carry a photo, a
 * line of copy and a button; at 170px it carries none of them, and the shopper
 * gets a worse version of the tile row that already exists two sections up.
 * Page length is the cost, which is what the section's own visibility control is
 * for.
 *
 * **`cardShape` is the composition; everything else adjusts it.** `stacked`
 * runs the picture above the copy, `split` sets it beside — and under `split`
 * the merchant then owns which SIDE it sits on (`cardSide`), how wide it is
 * (`cardSplit`) and whether there are any words at all (`cardHideText`). Which
 * reads better depends on their own photographs rather than on their theme, so
 * every one of those is theirs to answer.
 *
 * ⚠ `split` draws a DIFFERENT card on a phone, not the same one narrower. Even
 * columns need a full row to divide — half of a 390px card is ~170px each and
 * carries neither the photograph nor the sentence — so the phone runs the
 * picture as a thumbnail down the side (~30%, capped) with the copy taking the
 * rest. That shipped after the setting was reported as broken on a phone, which
 * it effectively was: the panel offered a choice that changed nothing on the
 * device carrying nearly all of this platform's traffic.
 *
 * Both compositions live entirely in `storefront.css`, so this component never
 * asks about a viewport it cannot see — it sets the classes and the VARIABLES,
 * and the breakpoint decides the values.
 */
export function CategoryBannerRow({
  base,
  categories,
  config,
  imageFit,
  defaultButtonLabel,
  renderStrip,
}: {
  base: string;
  /** The collections to advertise, in order — already picked by the caller. */
  categories: CatalogCategory[];
  config: BannerRowConfig | undefined;
  imageFit: "cover" | "canvas";
  /**
   * The button's wording for a card that has none of its own. Unset ⇒ such a
   * card draws no button: a builder section prints only the merchant's words.
   */
  defaultButtonLabel?: ReactNode;
  renderStrip: StripRenderer;
}) {
  /* ⚠ **Both screens, resolved together, because this page has no viewport.**
     A storefront renders on the server, so the component cannot ask whether it
     is on a phone — it emits BOTH compositions as `-d` / `-m` classes and
     variable slots, and the stylesheet's breakpoint reads the pair it wants.
     The phone inherits every field it has not been given its own answer for,
     which `resolveBannerLayout` owns so the editor's two tabs can show exactly
     what the shop will draw. */
  const layout = resolveBannerLayout(config);
  /* A side only means something once the picture is BESIDE the words — a
     stacked card has nothing to put on a side. The CSS is already scoped to the
     split class so a stray side class would be inert, but emitting one anyway
     puts a word in the markup that describes nothing, and the next person to
     read it has to go and prove that. Asked per SCREEN, because the shapes
     can differ: a row may be split on a desktop and stacked on a phone. */
  const sideOf = (l: (typeof layout)["desktop"]) =>
    l.shape === "split" ? l.side : "left";
  /* Unset stays unset: the stylesheet's own defaults are per-composition AND
     per-breakpoint, and resolving to a literal here would freeze a phone at a
     desktop shape. Shared across both screens on purpose — a square photograph
     is square on a phone, so this is not a device question. See
     `resolveCardRatio`. */
  const ratio = resolveCardRatio(config);
  /* The button, off by nothing more than a switch. The whole card is already
     the link, so a merchant who wants the photograph to do the selling loses
     no destination by turning it off — which is the reason it can be a plain
     boolean and not a "then how do they click it" problem. Shared with the
     product rows, whose "View all" it also governs. */
  const showCta = config?.showCta !== false;
  /* Corners. Unset is right for nearly every shop — corners are a brand
     decision made once in Design → Corners — so this only overrides when the
     merchant deliberately wanted this row to differ. */
  const radius = resolveCardRadius(config);
  /* ⚠ **The row becomes a scroll container if EITHER screen scrolls.** One DOM
     node serves both breakpoints, so "a track on a phone, a grid on a desktop"
     cannot be a choice of element — `CategoryStrip` supplies the track, the
     arrows and their edge detection (all behaviour, not CSS), and each
     breakpoint then either keeps the track or turns it back into a grid. When
     neither screen scrolls, none of that machinery is mounted at all. */
  const scrolls =
    layout.desktop.flow === "scroll" || layout.mobile.flow === "scroll";
  /* The words are gone on BOTH screens, so there is no visible text anywhere to
     take an accessible name from and the card's own name has to carry it. A
     card whose words are hidden on the phone only still has a heading in the
     DOM — `display: none` at that breakpoint removes it from the accessibility
     tree, but the label would then be read twice on a desktop. So this is
     deliberately the `&&` and not the `||`: the narrower answer is the one that
     is right on both screens at once. */
  const nameOnly = layout.desktop.hideText && layout.mobile.hideText;
  /* ⚠ **Has ANY of these collections got a line written about it?**
     Asked once for the row, like `photographed` on the tile section and for the
     same reason — a block whose cards are different heights reads as broken
     rather than as varied.

     It decides the card's HEIGHT, which is the thing that looked wrong: the
     split card takes its height from the photograph's aspect box, so a card
     carrying only a name and a button (~100px of copy) was stretched to ~180px
     by a 4:3 picture beside it, and the difference showed as a band of empty
     card. Descriptions are optional and most shops start without them, so this
     is the common case, not the edge one. With none, the photo takes a wide
     enough ratio that the copy sets the height instead — see
     `.sf-banner-row--terse`.

     ⚠ Asked against what the card will actually PRINT, not against the
     collection — a merchant who wrote card copy for a collection that has no
     description of its own has a full card, and shortening it would undo the
     thing they just typed. Moot once the words are off entirely, which is why
     `hideText` short-circuits it: there is no copy left for the height to come
     from, so squashing the picture would only shrink the whole card. */
  const described = categories.some(
    (category) =>
      sectionCard(config, category._id)?.description?.trim() ||
      category.description?.trim(),
  );
  /* An explicit height already fixes the picture, so the automatic shortening
     has nothing left to fix — and emitting both would be two answers to one
     question with only the cascade deciding. */
  const terseDesktop =
    !layout.desktop.hideText && !layout.desktop.height && !described;
  const terseMobile =
    !layout.mobile.hideText && !layout.mobile.height && !described;
  if (!categories.length) return null;

  /* One class per screen per answer. Verbose on the wire and cheap everywhere
     else: the alternative is a component that branches on a viewport it cannot
     see, or a second render pass on the client. */
  const className = [
    "sf-banner-row",
    layout.desktop.flow === "scroll"
      ? "sf-banner-row--track-d"
      : "sf-banner-row--wrap-d",
    layout.mobile.flow === "scroll"
      ? "sf-banner-row--track-m"
      : "sf-banner-row--wrap-m",
    layout.desktop.perRow ? "sf-banner-row--cols-d" : "",
    layout.mobile.perRow ? "sf-banner-row--cols-m" : "",
    terseDesktop ? "sf-banner-row--terse-d" : "",
    terseMobile ? "sf-banner-row--terse-m" : "",
    sideOf(layout.desktop) === "right" ? "sf-banner-row--right-d" : "",
    sideOf(layout.desktop) === "alternate" ? "sf-banner-row--alternate-d" : "",
    sideOf(layout.mobile) === "right" ? "sf-banner-row--right-m" : "",
    sideOf(layout.mobile) === "alternate" ? "sf-banner-row--alternate-m" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const style: CSSProperties = {
    ...(layout.desktop.perRow
      ? ({ "--sf-bc-per-d": layout.desktop.perRow } as CSSProperties)
      : null),
    ...(layout.mobile.perRow
      ? ({ "--sf-bc-per-m": layout.mobile.perRow } as CSSProperties)
      : null),
  };

  const cards = categories.map((category) => {
    /* The merchant's own words for THIS card, over the collection's.
       Every field falls back, so an untouched card is byte-for-byte the
       card that existed before overrides — and none of this is written
       back to the collection, which keeps its name and its description
       for its own page and every other row that lists it. */
    const card = sectionCard(config, category._id);
    const image = cardImageUrl(card?.image ?? category.image);
    const name = card?.title?.trim() || category.name;
    const description =
      card?.description?.trim() || category.description?.trim();
    const buttonLabel = card?.buttonLabel?.trim() || defaultButtonLabel;
    /* ⚠ **`storeLinkHref`, not `storeHref`.** This is a string the
       merchant typed, and the two helpers treat one very differently:
       `storeHref` concatenates, so a full address became
       `/shop/https://…`, a link copied from their own address bar became
       `/shop/shop/products`, and on a custom domain — where the base is
       `""` — a `//host` value walked the shopper clean off the shop.
       `storeLinkHref` passes real URLs through, strips the `/shop`
       prefix and refuses every other scheme, which is what every other
       merchant-entered link in the storefront already goes through. */
    const href = card?.buttonHref?.trim()
      ? storeLinkHref(base, card.buttonHref)
      : collectionHref(base, category);
    return (
      <Link
        key={category._id}
        href={href}
        /* The card's name when there is no visible text to borrow one
           from — the same rule `HeroSlideLink` follows for a picture-only
           slide. Left off otherwise so the heading inside is not read
           twice. */
        aria-label={nameOnly ? name : undefined}
        className={[
          "sf-banner-card",
          layout.desktop.shape === "split" ? "sf-banner-card--split-d" : "",
          layout.mobile.shape === "split" ? "sf-banner-card--split-m" : "",
          layout.desktop.hideText ? "sf-banner-card--notext-d" : "",
          layout.mobile.hideText ? "sf-banner-card--notext-m" : "",
          layout.desktop.height ? "sf-banner-card--fixedh-d" : "",
          layout.mobile.height ? "sf-banner-card--fixedh-m" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius:
            radius === undefined ? "var(--radius-lg)" : `${radius}px`,
          /* ⚠ **Slots, not values.** Every one of these names ends in a
             suffix the stylesheet reads through a `var()` fallback, so a
             breakpoint still decides what an unset one means — writing a
             VALUE inline would outrank every media query, which is the
             pattern `storefront.css` opens by forbidding. It is also what
             lets one document carry two screens' answers: `-d` and `-m`
             are read in their own `@media` blocks. An explicit merchant
             choice is emitted only when they chose, so an untouched row
             still hands both to the stylesheet.

             A height REPLACES the shape rather than joining it — with
             both, the aspect box computes a width from the height and the
             picture collapses to a column — which the `--fixedh-*`
             classes handle, per screen. */
          ...(ratio
            ? ({ "--sf-bc-ratio-set": cardRatioValue(ratio) } as CSSProperties)
            : null),
          ...(layout.desktop.height
            ? ({ "--sf-bc-h-d": `${layout.desktop.height}px` } as CSSProperties)
            : null),
          ...(layout.mobile.height
            ? ({ "--sf-bc-h-m": `${layout.mobile.height}px` } as CSSProperties)
            : null),
          ...(layout.desktop.shape === "split" && layout.desktop.split
            ? ({
                "--sf-bc-split-d": cardSplitValue(layout.desktop.split),
              } as CSSProperties)
            : null),
          ...(layout.mobile.shape === "split" && layout.mobile.split
            ? ({
                "--sf-bc-split-m": cardSplitValue(layout.mobile.split),
              } as CSSProperties)
            : null),
        }}
      >
        {/* One aspect box for the whole row, whether or not the merchant
            photographed every collection — a block whose cards are
            different heights reads as broken rather than as varied.

            ⚠ The ratio is a CSS VARIABLE, not a number chosen here, and
            that is what lets the breakpoint have the last word: the
            built-in shape differs by composition (16:9 stacked, 4:3
            split) AND by screen (a phone runs its own), and a
            server-rendered component cannot see a viewport. */}
        {image ? (
          <Media
            src={image}
            alt={name}
            radius={0}
            fit={imageFit}
            /* ⚠ **The stylesheet finds the picture by THIS class, never
               by its position.** `Media` wraps its `<img>` in a
               `<picture style="display: contents">`, so the card's
               `:first-child` is a wrapper that generates NO BOX — every
               rule written against it (`order`, `align-self`) was
               silently inert. `className` lands on the real box in both
               branches: the `<img>` for `cover`, the wrapper `<div>` for
               `canvas`. */
            className="sf-banner-media"
            /* `height` is declared unconditionally and defaults to
               `auto`, so one style serves both the shaped card and the
               fixed-height one. Inline because `Media` writes its own
               `aspect-ratio` inline and a class could never outrank it. */
            style={{
              aspectRatio: "var(--sf-bc-ratio)",
              height: "var(--sf-bc-h)",
            }}
          />
        ) : (
          /* Carries the class too: an unphotographed collection still
             occupies the picture's column, and without it the empty box
             would ignore the side and width the rest of the row obeys. */
          <span
            aria-hidden
            className="sf-banner-media"
            style={{
              aspectRatio: "var(--sf-bc-ratio)",
              height: "var(--sf-bc-h)",
              display: "block",
              background: "var(--primary-soft)",
            }}
          />
        )}
        {/* Dropped from the DOM only when BOTH screens hide the words. A
            phone-only hide is `display: none` in the stylesheet instead,
            because one HTML document serves both and this component
            cannot know which screen is reading it. */}
        {nameOnly ? null : (
          <span className="sf-banner-body">
            <span
              className="sf-display"
              style={{
                display: "block",
                fontSize: "var(--h2)",
                fontWeight: 700,
                color: "var(--text)",
              }}
            >
              {name}
            </span>
            {description ? (
              /* Two lines, then an ellipsis. The merchant writes this line
                 once and it is printed at four different widths across the
                 block's breakpoints, so a long one has to stop somewhere the
                 card can absorb — the full text heads the collection page
                 this card leads to. */
              <span className="sf-banner-copy">{description}</span>
            ) : null}
            {/* A BUTTON, not the arrow link every product row ends with.
                That link is a navigation affordance beside a heading; this
                is the call to action of an advertisement, and the only
                thing on the card asking to be pressed. It is a `span`
                because the whole card is already the anchor — a nested
                `<a>` is invalid and a second tab stop for the same
                destination. */}
            {showCta && buttonLabel ? (
              <span
                style={{
                  ...brandButton({ radius: "var(--radius-sm)", padding: "8px 16px", fontSize: 13 }, { overPhoto: true }),
                  marginTop: 12,
                  display: "inline-block",
                  fontWeight: 600,
                }}
              >
                {buttonLabel}
              </span>
            ) : null}
          </span>
        )}
      </Link>
    );
  });

  /* A plain grid, or a scroll container when either screen asks for one. The
     track is `CategoryStrip` (through `renderStrip`), the same component the
     category tiles and the collections row use: arrow state is a measurement
     (`ResizeObserver` + `onScroll`), and a second implementation of that would
     be a second set of edge-case bugs. */
  if (!scrolls) {
    return (
      <div className={className} style={style}>
        {cards}
      </div>
    );
  }
  return renderStrip({
    align: "left",
    gap: "var(--gap)",
    vars: style,
    trackClassName: className,
    /* Off by the merchant's switch, not by the absence of one: the stylesheet
       already keeps arrows to pointer devices, so this is the shop that wants
       a bare track on the screens that would have them. */
    arrows: config?.cardArrows !== false,
    children: cards,
  });
}
