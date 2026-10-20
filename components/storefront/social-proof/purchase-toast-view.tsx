"use client";
// coding-standard: maintained

import type { CSSProperties, ReactNode } from "react";
import { Icon } from "@/components/storefront/sf-icons";
import { readableOn, type SocialLook } from "@/lib/storefront-social-proof";

const RADIUS: Record<SocialLook["toastRadius"], string> = {
  theme: "var(--radius-md, 12px)",
  square: "4px",
  rounded: "14px",
  pill: "999px",
};

/**
 * The toast's colours. Light / dark / brand follow the theme's own tokens, so a theme change
 * carries them; custom uses the merchant's pair, and a missing text colour is picked by contrast.
 */
function toastColors(look: SocialLook): CSSProperties {
  switch (look.toastStyle) {
    case "dark":
      return { background: "#18181b", color: "#fafafa", border: "1px solid #27272a" };
    case "brand":
      return { background: "var(--primary, #2563eb)", color: "var(--on-primary, #fff)", border: "none" };
    case "custom": {
      const bg = look.toastBg ?? "#ffffff";
      return { background: bg, color: look.toastText ?? readableOn(bg), border: "none" };
    }
    default:
      return {
        background: "var(--card, #fff)",
        color: "var(--text, #111)",
        border: "1px solid var(--border, #e4e4e7)",
      };
  }
}

/**
 * One purchase toast as drawn — shared by the storefront island and the Customize panel's own
 * preview, so the merchant tunes exactly what shoppers see. `wrap` is the link around the body
 * (the product page on the shop, nothing in the editor).
 */
export function PurchaseToastView({
  look,
  text,
  timeText,
  imageUrl,
  onClose,
  closeLabel,
  wrap = (body) => body,
  style,
}: {
  look: SocialLook;
  text: string;
  timeText?: string;
  imageUrl?: string;
  onClose?: () => void;
  closeLabel: string;
  wrap?: (body: ReactNode) => ReactNode;
  style?: CSSProperties;
}) {
  const compact = look.toastSize === "compact";
  const image = compact ? 40 : 52;
  const pill = look.toastRadius === "pill";
  // The photo setting shapes the placeholder too — a product without a photo must still follow it.
  const photoRadius = look.toastImage === "round" || pill ? "50%" : "6px";
  const body = (
    <span style={{ display: "flex", alignItems: "center", gap: compact ? 9 : 11, minWidth: 0 }}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- a 52px thumbnail URL from the feed; next/image would add a loader round-trip for nothing.
        <img
          src={imageUrl}
          alt=""
          width={image}
          height={image}
          style={{
            width: image,
            height: image,
            flexShrink: 0,
            objectFit: "cover",
            borderRadius: photoRadius,
            background: "rgba(127,127,127,0.12)",
          }}
        />
      ) : (
        <span
          style={{
            width: compact ? 28 : 34,
            height: compact ? 28 : 34,
            flexShrink: 0,
            borderRadius: photoRadius,
            display: "grid",
            placeItems: "center",
            background: "rgba(127,127,127,0.14)",
          }}
        >
          <Icon name="bag" size={compact ? 15 : 17} />
        </span>
      )}
      <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span
          style={{
            fontSize: compact ? 12.5 : 13.5,
            fontWeight: 500,
            lineHeight: 1.35,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {text}
        </span>
        {timeText ? (
          <span style={{ fontSize: compact ? 11 : 11.5, opacity: 0.7 }}>{timeText}</span>
        ) : null}
      </span>
    </span>
  );

  return (
    <div
      role="status"
      data-purchase-toast=""
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: compact ? "8px 8px 8px 9px" : pill ? "9px 12px 9px 9px" : "10px 10px 10px 11px",
        borderRadius: RADIUS[look.toastRadius],
        boxShadow: "0 10px 30px -12px rgba(0,0,0,0.35)",
        width: "min(360px, calc(100vw - 32px))",
        boxSizing: "border-box",
        ...toastColors(look),
        ...style,
      }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>{wrap(body)}</span>
      {onClose ? (
        <button
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
          style={{
            flexShrink: 0,
            alignSelf: "flex-start",
            border: "none",
            background: "transparent",
            color: "inherit",
            opacity: 0.6,
            cursor: "pointer",
            padding: 4,
            lineHeight: 0,
          }}
        >
          <Icon name="close" size={14} />
        </button>
      ) : null}
    </div>
  );
}
