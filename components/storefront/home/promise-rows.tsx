// coding-standard: maintained
import type { IconName } from "@/components/storefront/sf-icons";
import { IconDisc } from "@/components/storefront/icon-disc";

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
          <IconDisc name={(promise.icon as IconName) || PROMISE_ICONS[i % PROMISE_ICONS.length]} />
          <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.35, color: "var(--text)" }}>
            {promise.text}
          </span>
        </div>
      ))}
    </div>
  );
}
