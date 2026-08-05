"use client";
// coding-standard: maintained

import { Icon, type IconName } from "@/components/storefront/sf-icons";
import { wrap, type SectionProps } from "@/components/storefront/home/home-shared";

/**
 * The three-up delivery/warranty/price reassurance row.
 *
 * The copy is dictionary text, not the owner's `trustBadges` — those belong to
 * the Rich footer and are a separate control. Wiring them together would change
 * what every hero-split store shows today, so it stays a deliberate follow-up.
 */
export function TrustSection({ t }: SectionProps) {
  const trust: { icon: IconName; t1: string; t2: string }[] = [
    { icon: "truck", t1: t.trust1t, t2: t.trust1s },
    { icon: "shield", t1: t.trust2t, t2: t.trust2s },
    { icon: "tag", t1: t.trust3t, t2: t.trust3s },
  ];
  return (
    <div style={{ ...wrap, padding: "0 var(--pad) 4px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(var(--trustcols), minmax(0,1fr))", gap: "var(--gap)" }}>
        {trust.map((tr) => (
          <div key={tr.t1} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 11, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ color: "var(--primary)" }}>
              <Icon name={tr.icon} size={22} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{tr.t1}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{tr.t2}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
