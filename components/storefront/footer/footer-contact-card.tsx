"use client";
// coding-standard: maintained

import type { CSSProperties } from "react";
import type { StorefrontStore } from "@/lib/storefront-client";
import { useContactLink } from "@/components/storefront/use-contact-link";
import { Icon } from "@/components/storefront/sf-icons";
import type { FooterT } from "@/components/storefront/footer/footer-pieces";

/**
 * The "talk to a person" block that leads the `contact` footer.
 *
 * A large share of orders in this market start with a call or a WhatsApp
 * message, and the footer is where a hesitant buyer looks for evidence that a
 * real person is behind the shop. So this layout fills the wide left side with
 * the thing most likely to convert rather than merely tightening the grid.
 *
 * **Every element is the merchant's own configuration**, and each is optional:
 * the heading is `theme.footerContactHeading`, the number is
 * `contact.phone` (Settings → General), the chat buttons and the hours note come
 * from the floating launcher's config (`contactButton`) via `useContactLink` —
 * the *same* resolver the launcher uses, so the two can never offer a channel
 * the other has dropped. Nothing is duplicated into a footer-only field.
 *
 * Returns `null` when the merchant has published neither a number nor a chat
 * channel; `ContactFooter` treats that as "render the plain anchored body", so
 * the layout degrades instead of showing an empty card.
 */
export function FooterContactCard({
  store,
  base,
  t,
  heading,
  phone,
}: {
  store?: StorefrontStore;
  base: string;
  t: FooterT;
  heading?: string;
  phone: string;
}) {
  const contact = useContactLink(store, base);
  const number = phone.trim();
  const channels = contact?.channels ?? [];

  // Same condition as `useHasContactSurface`, kept as a guard so the component
  // is safe to render on its own; `ContactFooter` asks first because it has a
  // whole layout to switch, not just a block to hide.
  if (!number && channels.length === 0) return null;

  // The launcher's hours are a reply-time promise, and that is exactly what a
  // shopper deciding whether to call at 10pm wants to read. Rendered as the
  // stated window, not as a live open/closed badge — that one depends on the
  // visitor's clock and belongs to the launcher, which can re-render for it.
  const hours = contact?.hours?.enabled ? contact.hours : undefined;
  const window = hours?.from && hours?.to ? `${hours.from}–${hours.to}` : "";

  return (
    <div style={card}>
      <div style={label}>{heading?.trim() || t.footerOrderByPhone}</div>

      {number ? (
        <a href={`tel:${number.replace(/\s+/g, "")}`} style={phoneLink}>
          {number}
        </a>
      ) : null}

      {window ? <span style={hoursLine}>{window}</span> : null}

      {channels.map((channel) => (
        <a
          key={channel.kind}
          href={contact!.hrefFor(channel)}
          target="_blank"
          rel="noopener noreferrer"
          style={chatButton}
        >
          <Icon name={channel.spec.icon} size={15} />
          {channel.label}
        </a>
      ))}
    </div>
  );
}

/**
 * Has the merchant published anything a shopper could reach them on?
 *
 * `ContactFooter` asks this **before** committing to the three-column layout:
 * with no number and no chat channel the card would be empty, and a layout built
 * around an empty card is worse than the plain one. Same test the card makes
 * internally — kept in one place so the two cannot disagree about what "has a
 * contact surface" means.
 */
export function useHasContactSurface(
  store: StorefrontStore | undefined,
  base: string,
  phone: string,
): boolean {
  const contact = useContactLink(store, base);
  return !!phone.trim() || (contact?.channels.length ?? 0) > 0;
}

const card: CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  background: "var(--surface)",
  padding: "16px 17px",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 8,
};
const label: CSSProperties = {
  fontSize: 11.5,
  fontWeight: 600,
  color: "var(--text)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};
const phoneLink: CSSProperties = {
  fontSize: 21,
  fontWeight: 700,
  letterSpacing: "-0.01em",
  color: "var(--text)",
  textDecoration: "none",
  fontVariantNumeric: "tabular-nums",
};
const hoursLine: CSSProperties = {
  fontSize: 12,
  color: "var(--muted)",
};
const chatButton: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  background: "var(--primary)",
  color: "var(--on-primary)",
  fontSize: 12.5,
  fontWeight: 600,
  padding: "8px 13px",
  borderRadius: 8,
  textDecoration: "none",
};
