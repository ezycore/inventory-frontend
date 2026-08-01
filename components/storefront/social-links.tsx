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

// Owners often paste a bare phone number for WhatsApp — turn it into a wa.me
// link. Every other platform is stored as a full URL and passes through as-is.
function hrefFor(key: keyof SocialConfig, value: string): string {
  if (key !== "whatsapp") return value;
  return /^https?:\/\//i.test(value)
    ? value
    : `https://wa.me/${value.replace(/[^\d]/g, "")}`;
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
