// coding-standard: maintained
import { Icon, type IconName } from "@/components/storefront/sf-icons";

/**
 * An icon on a solid accent disc — the promise rows' and benefit cards' marker.
 *
 * The disc is solid so the icon survives a tinted section: an `--accent` glyph
 * on an `--accent-soft` ground is the one pairing in the palette with almost no
 * contrast. Pure markup, so a server component can render it.
 */
export function IconDisc({ name, size = 34 }: { name: IconName; size?: number }) {
  return (
    <span
      style={{
        flex: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: 999,
        background: "var(--accent)",
        color: "var(--on-accent)",
      }}
    >
      <Icon name={name} size={Math.round(size / 2)} />
    </span>
  );
}
