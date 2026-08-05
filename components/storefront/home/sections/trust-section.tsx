"use client";
// coding-standard: maintained

import { useSfPreview } from "@/services/stores/use-sf-preview-store";
import { Icon, type IconName } from "@/components/storefront/sf-icons";
import { wrap, type SectionProps } from "@/components/storefront/home/home-shared";

/** Built-in copy per slot, used until the owner writes their own. */
const slotDefaults = (t: SectionProps["t"]) =>
  [
    { icon: "truck" as IconName, title: t.trust1t, subtitle: t.trust1s },
    { icon: "shield" as IconName, title: t.trust2t, subtitle: t.trust2s },
    { icon: "tag" as IconName, title: t.trust3t, subtitle: t.trust3s },
  ] as const;

/**
 * The three-up delivery/warranty/price reassurance row.
 *
 * Shares `trustBadges` with the Rich footer — one merchant-facing concept
 * ("your promises"), rendered at the size each surface has room for: the footer
 * shows `text` alone, this row adds `subtitle`. The fallback is **per slot**, so
 * a merchant who fills in only the first badge keeps the built-in copy for the
 * other two rather than getting two blank cards.
 */
export function TrustSection({ t, trustBadges }: SectionProps) {
  const previewBadges = useSfPreview((s) => s.badges);
  const saved = previewBadges ?? trustBadges ?? [];
  const trust = slotDefaults(t).map((d, i) => {
    const badge = saved[i];
    return {
      icon: (badge?.icon as IconName) || d.icon,
      title: badge?.text?.trim() || d.title,
      subtitle: badge?.subtitle?.trim() || d.subtitle,
    };
  });

  return (
    <div style={{ ...wrap, padding: "0 var(--pad) 4px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(var(--trustcols), minmax(0,1fr))", gap: "var(--gap)" }}>
        {trust.map((tr) => (
          <div key={tr.title} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ color: "var(--primary)" }}>
              <Icon name={tr.icon} size={22} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{tr.title}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{tr.subtitle}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
