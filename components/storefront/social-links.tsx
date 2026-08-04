// coding-standard: maintained

import type { CSSProperties } from "react";
import { Icon, type IconName } from "@/components/storefront/sf-icons";

interface SocialConfig {
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
}

const ORDER: { key: keyof SocialConfig; icon: IconName; label: string }[] = [
  { key: "facebook", icon: "facebook", label: "Facebook" },
  { key: "instagram", icon: "instagram", label: "Instagram" },
  { key: "whatsapp", icon: "whatsapp", label: "WhatsApp" },
];

/**
 * Force an absolute URL.
 *
 * **A schemeless href is a RELATIVE href.** An owner who saves `facebook.com/rkrashu` — which is
 * how most people write a URL — used to get `<a href="facebook.com/rkrashu">`, which the browser
 * resolves against the shop's own origin. The Facebook button then navigated shoppers to a 404 on
 * the merchant's own storefront. This was live: `GET /facebook.com/rkrashu 404` in the dev log.
 *
 * Fixed at render rather than on save so already-stored values are corrected too.
 */
function absoluteUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  // Protocol-relative (`//facebook.com/x`) is already absolute — just pick the scheme.
  if (value.startsWith("//")) return `https:${value}`;
  return `https://${value}`;
}

/** Only digits, spaces and phone punctuation — i.e. a phone number rather than a URL. */
const PHONE_ONLY = /^[\d\s+()-]+$/;

/**
 * Owners paste WhatsApp as either a bare phone number or a link, and everything else as a URL that
 * may or may not carry its scheme. Exported for its test — the failure mode here is a dead link on
 * every storefront, which nothing else would catch.
 */
export function hrefFor(key: keyof SocialConfig, value: string): string {
  // Phone-shaped input is the only case that isn't already a URL. Testing the shape (rather than
  // "no scheme ⇒ phone") is what keeps `wa.me/8801…` from being stripped to its digits.
  if (key === "whatsapp" && PHONE_ONLY.test(value)) {
    return `https://wa.me/${value.replace(/\D/g, "")}`;
  }
  return absoluteUrl(value);
}

const btn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 40,
  height: 40,
  borderRadius: "50%",
  border: "1px solid var(--border)",
  color: "var(--muted)",
};

/**
 * Shared storefront social-links row — the single source for rendering a store's
 * Facebook / Instagram / WhatsApp as brand-icon buttons. Used across all footer
 * variants; renders nothing when no links are configured. Colors stay on
 * `--muted`/`--text` (never `--primary`, which can be near-black on dark cards).
 */
export function SocialLinks({
  social,
  label,
  size = 17,
  style,
}: {
  social?: SocialConfig;
  label?: string;
  size?: number;
  style?: CSSProperties;
}) {
  const links = ORDER.filter((s) => social?.[s.key]?.trim());
  if (links.length === 0) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", ...style }}>
      {label ? (
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)" }}>
          {label}
        </span>
      ) : null}
      {links.map((s) => (
        <a
          key={s.key}
          href={hrefFor(s.key, social![s.key]!.trim())}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.label}
          title={s.label}
          className="sf-social-btn"
          style={btn}
        >
          <Icon name={s.icon} size={size} />
        </a>
      ))}
    </div>
  );
}
