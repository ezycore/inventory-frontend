// coding-standard: maintained
import type { CSSProperties } from "react";
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import type { IconName } from "@/components/storefront/sf-icons";
import { IconDisc } from "@/components/storefront/icon-disc";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["benefits"]["settings"];
type BlockSpec = (typeof SECTION_SPECS)["benefits"]["blocks"]["settings"];

/**
 * What the product does for the shopper, as cards: an icon, a title and a line,
 * every word the merchant's. The column count applies past the breakpoint
 * (`.sfb-benefits`); a phone takes one column. Unset, it fits up to three.
 */
export function BenefitsSection({ settings, blocks }: SectionViewProps<Spec, BlockSpec>) {
  const columns = settings.columns ?? Math.min(blocks.length, 3);
  return (
    <>
      {settings.heading ? (
        <h2 style={{ fontSize: "var(--h2)", fontWeight: 700, margin: "0 0 16px", letterSpacing: "-0.02em" }}>
          {settings.heading}
        </h2>
      ) : null}
      <div className="sfb-benefits" style={{ "--sfb-benefit-cols": columns } as CSSProperties}>
        {blocks.map(({ id, settings: benefit }) => (
          <div key={id} style={card}>
            <IconDisc name={(benefit.icon as IconName | undefined) ?? "check"} size={40} />
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "14px 0 0" }}>{benefit.title}</h3>
            {benefit.text ? (
              <p style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.6, color: "var(--muted)", whiteSpace: "pre-line" }}>
                {benefit.text}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </>
  );
}

const card: CSSProperties = {
  padding: 20,
  background: "var(--card)",
  color: "var(--text)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  textAlign: "left",
};
