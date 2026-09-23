// coding-standard: maintained
import { Icon } from "@/components/storefront/sf-icons";

/**
 * "These items are not real" — above a cart or checkout previewed with the
 * sample basket (`services/storefront/use-preview-cart.ts`).
 *
 * It is drawn as editor chrome rather than shop content — dashed, muted, no
 * brand colour — because it is the one thing on the page the merchant must not
 * mistake for their shop. Without it the sample is indistinguishable from a real
 * basket, and a merchant would reasonably conclude their own cart had items in
 * it, or that the shop had put them there.
 *
 * It renders only inside an admin preview frame; a shopper never reaches a state
 * that draws it.
 */
export function PreviewCartNotice({ text }: { text: string }) {
  return (
    <div
      role="note"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "var(--surface)",
        border: "1px dashed var(--border-strong)",
        borderRadius: "var(--radius-sm)",
        color: "var(--muted)",
        fontSize: 12.5,
        lineHeight: 1.45,
        padding: "9px 12px",
        marginBottom: 14,
      }}
    >
      <span style={{ display: "flex", flex: "none" }}>
        <Icon name="cart" size={16} />
      </span>
      <span>{text}</span>
    </div>
  );
}
