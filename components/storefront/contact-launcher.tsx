"use client";
// coding-standard: maintained

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { StorefrontStore } from "@/lib/storefront-client";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useCartUI } from "@/services/stores/use-cart-ui-store";
import { Icon } from "@/components/storefront/sf-icons";
import { useContactHours } from "@/components/storefront/use-contact-hours";
import { useContactLink } from "@/components/storefront/use-contact-link";

/** Session-scoped so the nudge interrupts once, not once per page view. */
const NUDGE_KEY = "ezy-sf-nudge-seen";

/**
 * The floating chat launcher — storefront chrome, mounted once by `StoreShell`.
 *
 * Renders NOTHING unless the backend sent a `contactButton` block: presence is
 * what enables it (`resolvePublicContactButton` omits the block when the switch
 * is off or no channel resolves), so there is no `enabled` flag to read and a
 * store with the feature off can never leak a phone number into the markup.
 *
 * The render branches on how many channels are enabled, not on a layout setting
 * the merchant has to understand:
 * - **one** → the button IS the channel: its colour, its glyph, a direct link,
 *   one tap. The merchant who only uses WhatsApp must not pay a tap for a
 *   feature they do not have.
 * - **two or more** → a neutral launcher in the merchant's brand colour that
 *   fans the channels out as labelled rows. Green means WhatsApp, so a button
 *   standing for three platforms has no business wearing one platform's colour.
 */
export function ContactLauncher({
  base,
  store,
}: {
  base: string;
  store?: StorefrontStore;
}) {
  const { t } = useStorefrontUI();
  const [open, setOpen] = useState(false);
  const [nudged, setNudged] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const link = useContactLink(store, base);
  const cartOpen = useCartUI((s) => s.open);
  const away = useContactHours(link?.hours);
  const nudge = link?.nudge;

  // Escape and an outside click close the fan-out. A floating menu that survives
  // a tap elsewhere is the single most irritating thing this could do.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  // One-shot greeting nudge, guarded by sessionStorage rather than component
  // state: the shell survives client-side navigation, but a hard reload would
  // otherwise re-interrupt the same shopper on every page they land on.
  useEffect(() => {
    if (!nudge?.enabled || !nudge.text) return;
    try {
      if (sessionStorage.getItem(NUDGE_KEY)) return;
    } catch {
      // Private mode with storage blocked — skip the nudge rather than showing
      // it on every page, which is the failure a shopper would actually notice.
      return;
    }
    const timer = window.setTimeout(
      () => {
        setNudged(true);
        try {
          sessionStorage.setItem(NUDGE_KEY, "1");
        } catch {
          /* nothing to do — it simply shows again next session */
        }
      },
      Math.max(2, nudge.delaySeconds ?? 8) * 1000,
    );
    return () => window.clearTimeout(timer);
  }, [nudge?.enabled, nudge?.text, nudge?.delaySeconds]);

  if (!link) return null;
  // A floating action button sitting on top of a scrim reads as broken, whatever
  // its z-index says. The mobile menu sheet (70) and search overlay (100) cover
  // it on their own; the cart drawer is the one that needs asking.
  if (cartOpen) return null;

  const single = link.channels.length === 1 ? link.channels[0] : null;

  // A single channel wears its own brand colour; a launcher standing for several
  // wears the merchant's, falling back to the storefront primary.
  const vars = {
    "--sf-contact-color": single ? single.spec.color : "var(--primary)",
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      className="sf-contact sf-noprint"
      data-pos={link.position}
      style={vars}
    >
      {nudged && !open && nudge?.text ? (
        <button type="button" className="sf-contact-note" style={noteBtn} onClick={() => setNudged(false)}>
          {nudge.text}
        </button>
      ) : null}

      {away.isAway && away.note && !open ? (
        <div className="sf-contact-note">{away.note}</div>
      ) : null}

      {open
        ? link.channels.map((c) => (
            <a
              key={`${c.kind}:${c.value}`}
              className="sf-contact-row"
              href={link.hrefFor(c)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
            >
              <span style={{ background: c.spec.color }}>
                <Icon name={c.spec.icon} size={17} />
              </span>
              {c.label}
            </a>
          ))
        : null}

      {single ? (
        <a
          className="sf-contact-btn"
          data-away={away.isAway ? "1" : undefined}
          href={link.hrefFor(single)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.chatAria
            .replace("{store}", link.storeName)
            .replace("{channel}", single.label)}
        >
          <span className="sf-contact-glyph">
            <Icon name={single.spec.icon} size={26} />
          </span>
          <span className="sf-contact-label">{link.label}</span>
        </a>
      ) : (
        <button
          type="button"
          className="sf-contact-btn"
          data-open={open ? "1" : undefined}
          data-away={away.isAway ? "1" : undefined}
          aria-expanded={open}
          aria-label={open ? t.chatClose : link.label}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sf-contact-glyph">
            <Icon name={open ? "close" : "phone"} size={26} />
          </span>
          <span className="sf-contact-label">{link.label}</span>
        </button>
      )}
    </div>
  );
}

const noteBtn: CSSProperties = {
  cursor: "pointer",
  textAlign: "left",
  fontFamily: "inherit",
};
