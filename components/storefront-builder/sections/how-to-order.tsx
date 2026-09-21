// coding-standard: maintained
import type { CSSProperties } from "react";
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { responsiveVars } from "@/lib/storefront-builder/responsive";
import { TRACK } from "@/lib/storefront-builder/grid-track";
import { SectionLede } from "@/components/storefront-builder/section-lede";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["how-to-order"]["settings"];
type BlockSpec = (typeof SECTION_SPECS)["how-to-order"]["blocks"]["settings"];

/**
 * How ordering works, as numbered steps in the merchant's words. An ordered list,
 * so the sequence is real to a screen reader and the drawn numbers stay
 * decoration. Side by side past the breakpoint, stacked on a phone
 * (`.sfb-steps`). Landing pages only.
 */
export function HowToOrderSection({ settings, blocks }: SectionViewProps<Spec, BlockSpec>) {
  return (
    <>
      <SectionLede heading={settings.heading} subheading={settings.subheading} gap={18} />
      <ol className="sfb-steps" style={responsiveVars("sfb-step-track", settings.columns, TRACK) as CSSProperties}>
        {blocks.map(({ id, settings: step }, index) => (
          <li key={id} className="sfb-step">
            <span
              aria-hidden
              style={{
                flex: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: 999,
                background: "var(--primary)",
                color: "var(--on-primary)",
                fontWeight: 700,
              }}
            >
              {index + 1}
            </span>
            <div style={{ minWidth: 0, paddingTop: 6 }}>
              <div style={{ fontSize: 15.5, fontWeight: 700 }}>{step.title}</div>
              {step.text ? (
                <p style={{ margin: "4px 0 0", fontSize: 14, lineHeight: 1.6, color: "var(--muted)", whiteSpace: "pre-line" }}>
                  {step.text}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
