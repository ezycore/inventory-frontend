// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
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
      {settings.heading ? (
        <h2 style={{ fontSize: "var(--h2)", fontWeight: 700, margin: "0 0 18px", letterSpacing: "-0.02em" }}>
          {settings.heading}
        </h2>
      ) : null}
      <ol className="sfb-steps">
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
