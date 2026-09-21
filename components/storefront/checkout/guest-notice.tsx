// coding-standard: maintained

import Link from "next/link";
import type { Dict } from "@/lib/storefront-i18n";
import { storeHref } from "@/lib/storefront-links";
import { Icon } from "@/components/storefront/sf-icons";

/**
 * Shown on checkout when nobody is signed in. It is a NOTICE, not a gate — guest
 * checkout is the deliberate design (an account is post-purchase value and is
 * never worth more than the order), so this is styled neutrally rather than as a
 * warning: no red, no alert icon, and the sign-in link stays an offer.
 *
 * It earns its place because the consequence is invisible otherwise — a guest's
 * only record of the order is the tracking link on the confirmation screen, and
 * they should learn that before they order, not after. That is why it is shown
 * by default and why the merchant control below it is per-device rather than a
 * single switch: on a phone this block costs about a hundred pixels above the
 * first input, and a merchant may want that height back there and nowhere else.
 *
 * `className` carries that choice as `sf-desktop-only` / `sf-mobile-only` — a
 * CLASS, because checkout is server-rendered and a `matchMedia` check paints the
 * wrong state before correcting itself. Those classes declare `!important`,
 * which they must: the `display: flex` below is inline and outranks a plain
 * class. "Hidden on both" never reaches here — `ContactFields` renders nothing.
 */
export function GuestNotice({
  base,
  t,
  className,
}: {
  base: string;
  t: Dict;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        display: "flex",
        gap: 11,
        alignItems: "flex-start",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        borderRadius: 10,
        padding: "12px 14px",
        marginBottom: 16,
      }}
    >
      <span style={{ color: "var(--muted)", display: "flex", flex: "none", marginTop: 1 }}>
        <Icon name="user" size={17} />
      </span>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 3 }}>
          {t.guestNoticeTitle}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55 }}>
          {t.guestNoticeBody}
        </div>
        <div style={{ fontSize: 12.5, marginTop: 7 }}>
          {t.haveAccount}{" "}
          <Link
            href={storeHref(base, "/account?next=/checkout")}
            style={{ fontWeight: 600, textDecoration: "underline" }}
          >
            {t.signIn}
          </Link>
        </div>
      </div>
    </div>
  );
}
