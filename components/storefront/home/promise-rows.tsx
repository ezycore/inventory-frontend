// coding-standard: maintained
import type { CSSProperties } from "react";
import { Icon, type IconName } from "@/components/storefront/sf-icons";
import { IconDisc } from "@/components/storefront/icon-disc";
import { NO_ICON, type PROMISE_ICON_STYLES } from "@/lib/storefront-builder/section-specs";

/** How a promises list draws its icons — see `PROMISE_ICON_STYLES`. */
export type PromiseIconStyle = (typeof PROMISE_ICON_STYLES)[number];

/**
 * Icon fallbacks for a promise the merchant left without one, by position.
 * ONE list for every surface that draws the store's promises: the footer used
 * to cycle its own (shield, truck, coins), so the same unset promise drew a
 * truck in the band and a shield in the footer right under it.
 */
export const PROMISE_ICONS: IconName[] = ["truck", "shield", "tag"];

/**
 * The glyph a promise draws, or `null` for none — the row's own "No icon", or
 * the list's `none` style, both mean a bare row.
 */
export function promiseIcon(icon: string | undefined, index: number, style: PromiseIconStyle): IconName | null {
  if (style === "none" || icon === NO_ICON) return null;
  return (icon as IconName) || PROMISE_ICONS[index % PROMISE_ICONS.length];
}

/**
 * One promise's icon in the list's style: on a solid accent disc, or a bare
 * glyph in the brand colour. Shared by the promises band and the footer's
 * promises, so the same setting draws the same mark in both.
 */
export function PromiseIcon({
  name,
  style,
  size = 34,
}: {
  name: IconName;
  style: Exclude<PromiseIconStyle, "none">;
  /** The disc's diameter. The plain glyph is sized for its row, not by this. */
  size?: number;
}) {
  if (style === "disc") return <IconDisc name={name} size={size} />;
  return (
    <span style={{ color: "var(--primary)", display: "flex", flex: "none" }}>
      <Icon name={name} size={19} />
    </span>
  );
}

/**
 * A shop's promises as icon + text rows, in the merchant's OWN words — "we are
 * a licensed pharmacy" is a claim only the merchant can make. Drawn by the home
 * page's `TrustBand` and the Storefront Builder's promises band.
 *
 * Pure markup, so a server component can render it.
 */
export function PromiseRows({
  promises,
  iconStyle = "disc",
  className,
  style,
}: {
  promises: readonly { text: string; icon?: string }[];
  /** Unset is `disc`, what every band drew before the setting. */
  iconStyle?: PromiseIconStyle;
  /** The builder band's own column count rides on the list — see `PromisesBandSection`. */
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={className ? `sf-trust-list ${className}` : "sf-trust-list"} style={style}>
      {promises.map((promise, i) => {
        /* The row is a two-column grid with a track sized for the disc, so a
           row without one has to say so: the text landed in that track and
           wrapped two words to a line. A plain glyph gets a narrower track. */
        const icon = promiseIcon(promise.icon, i, iconStyle);
        const variant = !icon ? " sf-trust-row--bare" : iconStyle === "plain" ? " sf-trust-row--plain" : "";
        return (
          <div key={`${i}:${promise.text}`} className={`sf-trust-row${variant}`}>
            {icon && iconStyle !== "none" ? <PromiseIcon name={icon} style={iconStyle} /> : null}
            {/* INHERIT, never `var(--text)`: a builder band carries the
                section's Text colour on the frame and every line drawn on it
                has to read it (`.sfb-sec[data-tone]`). Hardcoding the token
                left the promises the theme's colour on a merchant's own ground.
                On the classic home the inherited colour IS `--text`. */}
            <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.35, color: "inherit" }}>
              {promise.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}
