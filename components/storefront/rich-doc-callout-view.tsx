// coding-standard: maintained
import type { RichDocCalloutNode, RichDocCalloutVariant } from "@/lib/storefront-rich-doc";
import { RichDocInline } from "@/components/storefront/rich-doc-view";
import { proseCallout } from "@/components/storefront/storefront-prose-styles";

/**
 * Renders a rich-doc callout / notice box (shipping notes, policy warnings).
 * Variant is enum-validated (unknown → info); content is paragraph-only.
 */
const VARIANTS = new Set<RichDocCalloutVariant>(["info", "warning", "success"]);

export function RichDocCalloutView({ callout }: { callout: RichDocCalloutNode }) {
  const raw = callout.attrs?.variant;
  const variant: RichDocCalloutVariant = raw && VARIANTS.has(raw) ? raw : "info";
  return (
    <div style={proseCallout(variant)}>
      {(callout.content ?? []).map((p, i) => (
        <p key={i} style={{ margin: i === 0 ? 0 : "8px 0 0" }}>
          <RichDocInline nodes={p.content} />
        </p>
      ))}
    </div>
  );
}
