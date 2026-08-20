// coding-standard: maintained

import type { CSSProperties } from "react";
import { Icon, type IconName } from "@/components/storefront/sf-icons";
import {
  normalizeSocialProfile,
  SOCIAL_PROFILES,
  type SocialProfileKey,
} from "@/lib/storefront-social";

interface SocialConfig {
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  profiles?: { platform: string; url: string }[];
}

const ORDER: { key: SocialProfileKey; icon: IconName; label: string }[] = [
  ...SOCIAL_PROFILES.map((profile) => ({
    key: profile.key,
    icon: profile.icon,
    label: profile.label,
  })),
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
export function hrefFor(key: SocialProfileKey | "whatsapp", value: string): string {
  // Phone-shaped input is the only case that isn't already a URL. Testing the shape (rather than
  // "no scheme ⇒ phone") is what keeps `wa.me/8801…` from being stripped to its digits.
  if (key === "whatsapp" && PHONE_ONLY.test(value)) {
    return `https://wa.me/${value.replace(/\D/g, "")}`;
  }
  if (key !== "whatsapp") return normalizeSocialProfile(key as SocialProfileKey, value);
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
 * configured profiles as brand-icon buttons. Used across all footer
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
  const profileMap = new Map(
    (social?.profiles ?? []).map(({ platform, url }) => [platform, url.trim()]),
  );
  if (social?.facebook?.trim() && !profileMap.has("facebook")) {
    profileMap.set("facebook", social.facebook.trim());
  }
  if (social?.instagram?.trim() && !profileMap.has("instagram")) {
    profileMap.set("instagram", social.instagram.trim());
  }
  const links: {
    key: SocialProfileKey | "whatsapp";
    icon: IconName;
    label: string;
    value: string;
  }[] = ORDER.flatMap((profile) => {
    const value = profileMap.get(profile.key);
    return value ? [{ ...profile, value }] : [];
  });
  if (social?.whatsapp?.trim()) {
    links.push({
      key: "whatsapp",
      icon: "whatsapp",
      label: "WhatsApp",
      value: social.whatsapp.trim(),
    });
  }
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
          href={hrefFor(s.key, s.value)}
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
