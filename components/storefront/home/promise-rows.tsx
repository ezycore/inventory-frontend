// coding-standard: maintained
import { Icon, type IconName } from "@/components/storefront/sf-icons";

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
}: {
  promises: readonly { text: string; icon?: string }[];
}) {
  return (
    <div className="sf-trust-list">
      {promises.map((promise, i) => (
        <div key={`${i}:${promise.text}`} className="sf-trust-row">
          {/* The icon gets a solid disc so it survives a tinted band — an
              `--accent` glyph on an `--accent-soft` ground is the one pairing
              in the palette with almost no contrast. */}
          <span
            style={{
              flex: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 34,
              height: 34,
              borderRadius: 999,
              background: "var(--accent)",
              color: "var(--on-accent)",
            }}
          >
            <Icon
              name={(promise.icon as IconName) || PROMISE_ICONS[i % PROMISE_ICONS.length]}
              size={17}
            />
          </span>
          <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.35, color: "var(--text)" }}>
            {promise.text}
          </span>
        </div>
      ))}
    </div>
  );
}
