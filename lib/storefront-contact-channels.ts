// coding-standard: maintained
import type { IconName } from "@/components/storefront/sf-icons";
import { hrefFor } from "@/components/storefront/social-links";
import { whatsappNumberLabel } from "@/lib/whatsapp-number";
import type { ContactChannelKind, StorefrontContactChannel } from "@/types";

/**
 * The contact-launcher channel registry — the ONLY place that knows how to turn
 * a merchant's stored handle into a link, and what that platform can carry.
 *
 * Adding Messenger is a row here plus a member on `ContactChannelKind`; nothing
 * else in the launcher branches on the platform.
 *
 * `prefill` is the field that actually varies, and it is not decoration:
 * - `"text"`  — the message lands in the shopper's compose box (wa.me, t.me, mailto).
 * - `"ref"`   — the platform accepts a payload but shows the shopper nothing; it
 *               reaches the merchant's webhook only (m.me `?ref=`). Useful as
 *               attribution, useless as a message.
 * - `"none"`  — no parameters at all (ig.me), or not a text medium (tel:).
 *
 * A launcher that assumed every platform behaves like WhatsApp would build URLs
 * that Messenger and Instagram silently drop, and the context ("I'm asking about
 * the navy jacket") would vanish with no error anywhere.
 */
export interface ContactChannelSpec {
  /** Platform's own name — the fallback label in the fanned-out list. */
  name: string;
  icon: IconName;
  /** Brand colour, used only on the channel's own dot/bubble. */
  color: string;
  prefill: "text" | "ref" | "none";
  /** Placeholder shown in the admin's value field. */
  placeholder: string;
  /** Build the outbound URL. `message` is pre-resolved, never pre-encoded. */
  href: (value: string, message: string) => string;
}

export const CONTACT_CHANNELS: Record<ContactChannelKind, ContactChannelSpec> = {
  whatsapp: {
    name: "WhatsApp",
    icon: "whatsapp",
    color: "#25D366",
    prefill: "text",
    placeholder: "+8801XXXXXXXXX",
    /**
     * Normalise whatever the owner saved down to digits first, then build a
     * clean `wa.me/<digits>?text=…`.
     *
     * Most owners paste WhatsApp's share link, which already carries an EMPTY
     * `text` param (`…/send/?phone=880…&text&type=phone_number`). Appending our
     * own `&text=` to that produces two `text` params and the prefilled message
     * is silently dropped — the whole point of the feature, gone, with a link
     * that still opens correctly so nothing looks broken.
     *
     * Falls back to `hrefFor` when the value is a link we cannot read a number
     * out of: that helper handles the schemeless-URL case whose fix was learned
     * from a live bug, and a second link builder would be a second place for it
     * to come back.
     */
    href: (value, message) => {
      const digits = whatsappNumberLabel(value).replace(/\D/g, "");
      const base = digits ? `https://wa.me/${digits}` : hrefFor("whatsapp", value);
      if (!message) return base;
      return `${base}${base.includes("?") ? "&" : "?"}text=${encodeURIComponent(message)}`;
    },
  },
};

/** Ordered specs for the channels the merchant has enabled, unknown kinds dropped. */
export function resolveChannels(
  channels: Pick<StorefrontContactChannel, "kind" | "value" | "label">[],
): { kind: ContactChannelKind; value: string; label: string; spec: ContactChannelSpec }[] {
  return channels.flatMap((c) => {
    const spec = CONTACT_CHANNELS[c.kind];
    // A kind the storefront bundle doesn't know yet (server ahead of client on a
    // partial deploy) is skipped, not rendered as a dead button.
    if (!spec || !c.value?.trim()) return [];
    return [{ kind: c.kind, value: c.value.trim(), label: c.label?.trim() || spec.name, spec }];
  });
}
