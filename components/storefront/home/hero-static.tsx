// coding-standard: maintained
import type { CSSProperties, ReactNode } from "react";
import { Icon } from "@/components/storefront/sf-icons";
import { Media } from "@/components/storefront/sf-bits";

/**
 * The two static heroes' markup — framed (`HeroCardView`) and open
 * (`HeroOpenView`) — with copy, photo and buttons already resolved by the
 * caller. Pure, so a server component can render it: the home page's
 * `HeroCard` / `HeroOpen` pass the store banner and its copy, the Storefront
 * Builder's hero passes a single slide.
 */

/** The hero photo, as `Media` takes it. */
export interface HeroPhoto {
  src: string;
  mobileSrc?: string;
  fit: "cover" | "canvas";
  focal?: string;
  mobileFocal?: string;
}

export const heroPrimaryButton: CSSProperties = {
  background: "var(--primary)",
  color: "var(--on-primary)",
  padding: "12px 24px",
  borderRadius: "var(--radius-sm)",
  fontSize: 14,
  fontWeight: 600,
};

export const heroSecondaryButton: CSSProperties = {
  color: "var(--text)",
  border: "1px solid var(--border-strong)",
  padding: "12px 22px",
  borderRadius: "var(--radius-sm)",
  fontSize: 14,
  fontWeight: 600,
};

/** The hero's button row, following the hero's own alignment. */
export function HeroActions({
  align = "left",
  children,
}: {
  align?: "left" | "center";
  children: ReactNode;
}) {
  return (
    /* `justifyContent`, not `textAlign`: the buttons are flex children, so
       centring the text around them leaves the row itself hard left. That is
       the exact failure a centred hero shows first — a centred headline over a
       left-aligned button pair reads as a layout bug rather than a choice. */
    <div
      style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : undefined,
      }}
    >
      {children}
    </div>
  );
}

interface HeroCopy {
  /** Text, or a builder hero's running-offer badge with its word in the shopper's language. */
  badge?: ReactNode;
  title: string;
  /** The title is the store's name standing in for one — kept for the outline, hidden from view. */
  hideTitle?: boolean;
  subtitle?: string;
  actions?: ReactNode;
  photo?: HeroPhoto;
}

/**
 * Classic — bordered hero card, copy left and photo right on a desktop; on a
 * phone the photo leads and the trust badges become the card's footer.
 *
 * **The only static hero styled by CLASS rather than inline**, because the phone
 * layout reorders its own children and no inline style can express that. The
 * rules, and why the mobile version had to change at all, are beside
 * `.sf-herocard` in storefront.css; the DOM order here (copy, photo, badges) is
 * the desktop reading order, which the phone re-points with `order`.
 */
export function HeroCardView({
  badge,
  title,
  hideTitle,
  subtitle,
  actions,
  photo,
  promises = [],
}: HeroCopy & { promises?: string[] }) {
  return (
    <div className="sf-herocard">
      <div className="sf-herocard-copy">
        {/* The ACCENT, not the brand. A hero badge is the storefront's most
            purely informational chip — "Week 33 · harvest in", a campaign
            name — sitting directly above the buttons that are the brand
            colour. Painting both in `--primary` was the loudest reason a shop
            read as one hue rather than a palette. Falls back to the brand pair
            when the merchant has set no accent, so nothing changes for them. */}
        {badge ? <span className="sf-herocard-badge">{badge}</span> : null}
        <h1 className={hideTitle ? "sf-visually-hidden" : "sf-herocard-title"}>{title}</h1>
        {subtitle ? <p className="sf-herocard-sub">{subtitle}</p> : null}
        {actions}
      </div>
      {/* Only when there IS one. The striped `Placeholder` exists so missing
          PRODUCT art stays honest rather than faked — but above the fold, on a
          shop that has simply not uploaded a banner yet (which is every shop on
          day one), a box captioned "hero banner" reads as a broken page, not as
          an empty slot. Rendering nothing and letting the copy run full width is
          a finished-looking default.

          The card is a `grid-template-areas` layout on a desktop, so dropping
          this child is not enough on its own — `.sf-herocard` carries a
          `:has()` rule that collapses to one column when it is absent.

          Wrapped rather than styled directly: `<Media>` sets its own radius
          inline, and the corner differs per breakpoint (the card's own
          `overflow: hidden` clips the full-bleed phone version). */}
      {photo ? (
        <div className="sf-herocard-media">
          <Media
            {...photo}
            alt=""
            label="hero banner"
            ratio="var(--herocard-ratio)"
            radius={0}
            /* The likely LCP image: a hero sits first on nearly every page, and
               a hero moved lower costs one early request, not a slow page. */
            priority
          />
        </div>
      ) : null}
      {promises.length ? (
        <div className="sf-herocard-trust">
          {promises.map((label) => (
            <span key={label}>
              <Icon name="check" size={15} /> {label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Open — the copy sits on the PAGE, with the picture in a tinted panel beside
 * it. No card, no border, no frame of any kind.
 *
 * **This exists because every other hero is a card**, and that turned out to be
 * the single loudest defect in a themed shop: a full-width `--card` block is the
 * first screen, so a store that chose a tinted ground showed near-white exactly
 * where its ground was supposed to introduce itself. Choose it whenever the
 * page's own colour is meant to be seen.
 */
export function HeroOpenView({
  badge,
  title,
  hideTitle,
  subtitle,
  actions,
  photo,
  align = "left",
}: HeroCopy & { align?: "left" | "center" }) {
  const centred = align === "center";
  return (
    <div
      style={{
        display: "grid",
        // No photo → the copy panel takes the full width (see HeroCardView).
        gridTemplateColumns: photo ? "var(--herocols)" : "1fr",
        gap: "clamp(24px,4vw,48px)",
        alignItems: "center",
      }}
    >
      {/* Centring is a TYPE decision, not a layout one, and that is why it
          needs no mobile variant: `--herocols` is `1fr` on a phone, so this
          hero is already a single column there and the only thing left to
          decide is where the words sit inside it.

          The subtitle's `maxWidth` has to be centred too — a 46ch column
          pinned to the left under a centred headline is the giveaway that a
          page was centred by half-measures. */}
      <div style={centred ? { textAlign: "center" } : undefined}>
        {/* The accent, like every other informational chip — see the note on
            `HeroCardView`'s badge. */}
        {badge ? (
          <span
            style={{
              display: "inline-block",
              background: "var(--accent-soft)",
              color: "var(--accent)",
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              padding: "6px 14px",
              borderRadius: 999,
              marginBottom: 18,
            }}
          >
            {badge}
          </span>
        ) : null}
        <h1
          className={hideTitle ? "sf-visually-hidden" : undefined}
          style={
            hideTitle
              ? undefined
              : {
                  fontSize: "var(--h1m)",
                  lineHeight: 1.02,
                  fontWeight: 700,
                  margin: "0 0 16px",
                  letterSpacing: "-0.02em",
                  whiteSpace: "pre-line",
                }
          }
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            style={{
              fontSize: 17,
              color: "var(--muted)",
              lineHeight: 1.55,
              margin: centred ? "0 auto 26px" : "0 0 26px",
              maxWidth: "46ch",
            }}
          >
            {subtitle}
          </p>
        ) : null}
        {actions}
      </div>
      {/* A tinted panel rather than a bare photo: the picture needs an edge to
          sit against once there is no card providing one, and `--accent-soft`
          gives it one without introducing a second near-white surface beside
          the page. Dropped entirely with no photo — an empty tinted block is
          worse than none (see HeroCardView). */}
      {photo ? (
        <div
          style={{
            background: "var(--accent-soft)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            padding: "clamp(14px,2vw,26px)",
          }}
        >
          <Media
            {...photo}
            alt=""
            label="lifestyle shot"
            ratio="4 / 3"
            radius={0}
            style={{ borderRadius: "var(--radius-md)" }}
            // The likely LCP image — see HeroCardView.
            priority
          />
        </div>
      ) : null}
    </div>
  );
}
