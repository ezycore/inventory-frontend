"use client";
// coding-standard: maintained

import { type CSSProperties, useState } from "react";
import type { StoreAnnouncement } from "@/lib/storefront-client";
import { readableTextOn } from "@/lib/color-contrast";
import {
  announcementStripAttrs,
  announcementVisibilityClass,
  marqueeDurationSeconds,
  stripPaddingInline,
  STRIP_FONT_SIZE,
  STRIP_PADDING_BLOCK,
} from "@/lib/storefront-strip-display";
import { useHydrated } from "@/hooks/use-hydrated";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { HeroCtaLink } from "@/components/storefront/home/home-shared";
import { Icon } from "@/components/storefront/sf-icons";

/**
 * The single-line announcement bar above the header (admin Navigation tab).
 * Text colour auto-derives from the owner's background unless an explicit
 * colour is set, so a light banner never renders unreadable white text.
 * Optional leading emoji + CTA button. Dismissible bars persist per-device
 * until the message changes — and never hide inside the live preview so the
 * owner always sees what they're editing.
 *
 * Per-breakpoint visibility is a CSS class, not a `matchMedia` branch — see
 * `stripVisibilityClass`. The bar is server-rendered, so a JS viewport check
 * would paint the wrong state and correct it after hydration.
 */
export function AnnouncementBar({
  announcement,
  base,
  slug,
}: {
  announcement?: StoreAnnouncement;
  base: string;
  slug: string;
}) {
  const { t } = useStorefrontUI();
  const hydrated = useHydrated();
  const previewActive = useSfPreview((s) => s.active);
  const [dismissed, setDismissed] = useState(false);

  const text = announcement?.text?.trim();
  const dismissible = announcement?.dismissible ?? false;
  const storageKey = `sf-ann-${slug}`;
  // Per-message key: a changed message re-shows a previously-dismissed bar.
  const msgKey = `${text ?? ""}|${announcement?.link ?? ""}`;

  // Reflect the persisted dismissal once hydrated (client-only; SSR has no
  // localStorage). Evaluated during render via the "store previous value"
  // pattern so it re-checks when the message key changes but never loops; the
  // dismiss click below writes storage and calls setDismissed(true) directly.
  const evalKey =
    hydrated && dismissible ? `${storageKey} ${msgKey}` : null;
  const [lastEvalKey, setLastEvalKey] = useState<string | null>(null);
  if (evalKey !== lastEvalKey) {
    setLastEvalKey(evalKey);
    let next = false;
    if (evalKey) {
      try {
        next = localStorage.getItem(storageKey) === msgKey;
      } catch {
        /* storage disabled (private mode) — treat as not dismissed */
      }
    }
    setDismissed(next);
  }

  if (!announcement?.enabled || !text) return null;
  if (dismissible && dismissed && !previewActive) return null;

  const bg = announcement.bgColor || "var(--primary)";
  const img = announcement.bgImage;
  const imgUrl = img?.mediumUrl || img?.url;
  // Text can't auto-derive contrast from a photo, so default to white over an
  // image (the overlay darkens it); otherwise auto-match the solid bg colour.
  const fg = announcement.textColor?.trim()
    ? announcement.textColor
    : imgUrl
      ? "#ffffff"
      : announcement.bgColor
        ? readableTextOn(announcement.bgColor)
        : "var(--on-primary)";
  // Size and height are `data-*` attributes the stylesheet resolves, so one
  // preset means one thing per breakpoint (see the strip block in
  // storefront.css). Resolving them to pixels here is what froze the bar at
  // desktop spacing on a phone.
  const stripAttrs = announcementStripAttrs(announcement.size);
  const link = announcement.link?.trim();
  const cta = announcement.ctaLabel?.trim();
  // Scrolling is what a merchant reaches for when the notice is too long to sit
  // on one line. The duration comes from the message length so the PACE holds
  // as the wording changes — see `marqueeDurationSeconds`.
  const marquee = announcement.marquee ?? false;
  const duration = marqueeDurationSeconds(text, announcement.marqueeSpeed);

  const bgStyle: CSSProperties = imgUrl
    ? {
        backgroundColor: bg,
        backgroundImage: `url("${imgUrl}")`,
        ...(announcement.bgFit === "tile"
          ? { backgroundRepeat: "repeat", backgroundSize: "auto" }
          : {
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }),
      }
    : { background: bg };
  const overlayOpacity =
    Math.min(100, Math.max(0, announcement.overlayOpacity ?? 40)) / 100;

  const label = (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      {announcement.icon ? <span aria-hidden>{announcement.icon}</span> : null}
      <span>{text}</span>
    </span>
  );

  const content =
    cta && link ? (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {label}
        <HeroCtaLink
          base={base}
          link={link}
          style={{
            display: "inline-flex",
            alignItems: "center",
            color: "inherit",
            border: "1px solid currentColor",
            borderRadius: 999,
            padding: "2px 12px",
            fontWeight: 700,
            fontSize: `calc(${STRIP_FONT_SIZE} - 1px)`,
          }}
        >
          {cta}
        </HeroCtaLink>
      </span>
    ) : link ? (
      <HeroCtaLink
        base={base}
        link={link}
        style={{ color: "inherit", textDecoration: "none" }}
      >
        {label}
      </HeroCtaLink>
    ) : (
      label
    );

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey, msgKey);
    } catch {
      /* ignore — the bar simply reappears next visit */
    }
    setDismissed(true);
  };

  return (
    <div
      className={["sf-noprint", announcementVisibilityClass(announcement)]
        .filter(Boolean)
        .join(" ")}
      {...stripAttrs}
      style={{
        position: "relative",
        color: fg,
        textAlign: "center",
        fontSize: STRIP_FONT_SIZE,
        fontWeight: 500,
        paddingBlock: STRIP_PADDING_BLOCK,
        paddingInline: stripPaddingInline(dismissible),
        ...bgStyle,
      }}
    >
      {imgUrl ? (
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: announcement.overlay || "#000000",
            opacity: overlayOpacity,
            pointerEvents: "none",
          }}
        />
      ) : null}
      {marquee ? (
        <div
          className="sf-marquee"
          style={{ "--sf-marquee-dur": `${duration}s` } as CSSProperties}
        >
          <div className="sf-marquee-track">
            <span className="sf-marquee-item">{content}</span>
            {/* The seam. `inert` and not just `aria-hidden`: the copy can hold
                the merchant's CTA link, and a focusable control inside an
                aria-hidden subtree is a tab stop a screen reader cannot
                announce — the shopper lands on a button that says nothing. */}
            <span className="sf-marquee-item" aria-hidden inert>
              {content}
            </span>
          </div>
        </div>
      ) : (
        <span style={{ position: "relative", zIndex: 1 }}>{content}</span>
      )}

      {dismissible ? (
        <button
          type="button"
          onClick={dismiss}
          aria-label={t.dismiss}
          style={{
            position: "absolute",
            top: "50%",
            right: 8,
            transform: "translateY(-50%)",
            zIndex: 2,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 26,
            height: 26,
            color: "inherit",
            opacity: 0.75,
            background: "transparent",
            border: 0,
            cursor: "pointer",
          }}
        >
          <Icon name="close" size={15} />
        </button>
      ) : null}
    </div>
  );
}
