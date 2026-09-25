// coding-standard: maintained
import type { CSSProperties } from "react";
import type { IconName } from "@/components/storefront/sf-icons";
import { IconDisc } from "@/components/storefront/icon-disc";
import { NO_ICON } from "@/lib/storefront-builder/section-specs";

/** Icon fallbacks for a promise the merchant left without one. */
const PROMISE_ICONS: IconName[] = ["truck", "shield", "tag"];

/**
 * A shop's promises as icon + text rows, in the merchant's OWN words — "we are
 * a licensed pharmacy" is a claim only the merchant can make. Drawn by the home
 * page's `TrustBand` and the Storefront Builder's promises band.
 *
 * Pure markup, so a server component can render it.
 */
export function PromiseRows({
  promises,
  className,
  style,
}: {
  promises: readonly { text: string; icon?: string }[];
  /** The builder band's own column count rides on the list — see `PromisesBandSection`. */
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={className ? `sf-trust-list ${className}` : "sf-trust-list"} style={style}>
      {promises.map((promise, i) => {
        /* The cycled fallback is what an UNSET icon draws, so taking a disc off
           needs a value of its own — see `NO_ICON`. The row is a two-column
           grid with a 34px track for the disc, so a row without one has to say
           so: the text landed in that track and wrapped two words to a line. */
        const bare = promise.icon === NO_ICON;
        return (
          <div
            key={`${i}:${promise.text}`}
            className={bare ? "sf-trust-row sf-trust-row--bare" : "sf-trust-row"}
          >
            {bare ? null : (
              <IconDisc name={(promise.icon as IconName) || PROMISE_ICONS[i % PROMISE_ICONS.length]} />
            )}
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
