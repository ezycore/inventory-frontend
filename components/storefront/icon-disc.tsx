// coding-standard: maintained
import { Icon, type IconName } from "@/components/storefront/sf-icons";

/**
 * An icon on a solid accent disc — the promise rows' and benefit cards' marker.
 *
 * The disc is solid so the icon survives a tinted section: an `--accent` glyph
 * on an `--accent-soft` ground is the one pairing in the palette with almost no
 * contrast. Pure markup, so a server component can render it.
 */
export function IconDisc({
  name,
  size = 34,
  tone = "solid",
}: {
  name: IconName;
  size?: number;
  /**
   * `soft` is the quiet disc — the text colour on the surface grey — for a band
   * on a plain ground, where a row of solid accent discs is the loudest thing on
   * the page. Not for a tinted section: it has nothing to stand out against.
   */
  tone?: "solid" | "soft";
}) {
  return (
    <span
      className="sf-icon-disc"
      style={{
        flex: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: 999,
        background: tone === "soft" ? "var(--surface)" : "var(--accent)",
        color: tone === "soft" ? "var(--text)" : "var(--on-accent)",
      }}
    >
      <Icon name={name} size={Math.round(size / 2)} />
    </span>
  );
}
