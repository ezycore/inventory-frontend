"use client";
// coding-standard: maintained

import { type CSSProperties, useEffect, useState } from "react";
import type { StoreAnnouncement } from "@/lib/storefront-client";
import { readableTextOn } from "@/lib/color-contrast";
import { useHydrated } from "@/hooks/use-hydrated";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { HeroCtaLink } from "@/components/storefront/home/home-shared";
import { Icon } from "@/components/storefront/sf-icons";

const SIZE: Record<
  NonNullable<StoreAnnouncement["size"]>,
  { fontSize: number; padY: number }
> = {
  sm: { fontSize: 12.5, padY: 7 },
  md: { fontSize: 14, padY: 9 },
  lg: { fontSize: 15.5, padY: 11 },
};

/**
 * The single-line announcement bar above the header (admin Navigation tab).
 * Text colour auto-derives from the owner's background unless an explicit
 * colour is set, so a light banner never renders unreadable white text.
 * Optional leading emoji + CTA button. Dismissible bars persist per-device
 * until the message changes — and never hide inside the live preview so the
 * owner always sees what they're editing.
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

  useEffect(() => {
    if (!hydrated || !dismissible) return;
    try {
      setDismissed(localStorage.getItem(storageKey) === msgKey);
    } catch {
      /* storage disabled (private mode) — treat as not dismissed */
    }
  }, [hydrated, dismissible, storageKey, msgKey]);

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
  const { fontSize, padY } = SIZE[announcement.size ?? "sm"];
  const link = announcement.link?.trim();
  const cta = announcement.ctaLabel?.trim();

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
            fontSize: fontSize - 1,
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
      className="sf-noprint"
      style={{
        position: "relative",
        color: fg,
        textAlign: "center",
        fontSize,
        fontWeight: 500,
        padding: `${padY}px ${dismissible ? 40 : 16}px`,
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
      <span style={{ position: "relative", zIndex: 1 }}>{content}</span>

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
