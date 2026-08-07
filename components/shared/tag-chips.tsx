// coding-standard: maintained
import { Badge } from "@/ui/components/badge";
import { cn } from "@ui/lib/utils";

export interface TagChip {
  _id?: string;
  name?: string;
  /** Merchant-chosen colour. Applied to border + text, never as a fill. */
  color?: string;
}

interface TagChipsProps {
  tags?: TagChip[] | null;
  /**
   * Cap before collapsing the rest into "+N". A table row needs a tight cap so
   * a heavily tagged product cannot blow the row height out; a detail page has
   * room for all of them (pass `Infinity`).
   */
  max?: number;
  /** Rendered when the product carries no tags. Omit to render nothing. */
  empty?: string;
  className?: string;
}

/**
 * A product's tags, as coloured chips.
 *
 * Tags are the one many-to-many dimension in the catalog — a product carries
 * several, they drive the storefront facet and a `tag`-scoped campaign, and
 * they hold a `color` that exists only to be rendered. So a surface that names
 * a product and stays silent about them is hiding merchandising state.
 *
 * The table had the only copy of this markup; the card view and both detail
 * panels showed nothing at all, so switching views silently lost the tags.
 * One component so a fifth caller cannot reintroduce that.
 *
 * The colour is applied to the border and text rather than as a background:
 * merchants pick arbitrary colours, and a filled chip would put unreadable
 * text on half of them.
 */
export function TagChips({
  tags,
  max = 2,
  empty,
  className,
}: TagChipsProps) {
  const all = tags ?? [];
  if (all.length === 0) {
    return empty ? (
      <span className="text-muted-foreground/50 text-sm">{empty}</span>
    ) : null;
  }

  const shown = all.slice(0, max);
  const extra = all.length - shown.length;

  return (
    <div className={cn("flex items-center gap-1 flex-wrap", className)}>
      {shown.map((tag) => (
        <Badge
          key={tag._id ?? tag.name}
          variant="outline"
          className="text-xs"
          style={
            tag.color ? { borderColor: tag.color, color: tag.color } : undefined
          }
        >
          {tag.name}
        </Badge>
      ))}
      {extra > 0 && (
        <span className="text-xs text-muted-foreground">+{extra}</span>
      )}
    </div>
  );
}
