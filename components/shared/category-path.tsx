// coding-standard: maintained
import { cn } from "@ui/lib/utils";

interface CategoryPathProps {
  /** Top-level category name — `product.category?.name`. */
  category?: string | null;
  /** Child name — `product.subcategory?.name`. Absent for a top-level product. */
  subcategory?: string | null;
  /** Rendered when there is no category at all. Omit to render nothing. */
  fallback?: string;
  /** Applies to the whole path; the child inherits it and is dimmed relative to it. */
  className?: string;
}

/**
 * A product's place in the taxonomy, as ONE fact: "Phones › Accessories".
 *
 * The pair is denormalized (`categoryId` = the top-level category,
 * `subcategoryId` = its child), and reading only the first half is the easy
 * mistake — it renders cleanly and silently loses half the answer. The card
 * view, the detail hero and the detail info card each did exactly that while
 * the table beside them showed both, so switching views changed what the
 * product appeared to be filed under.
 *
 * One component so a fifth caller cannot re-introduce the same half-answer.
 *
 * The separator dims via `opacity`, not a fixed muted colour, so the path
 * inherits whatever the caller sets — `text-muted-foreground` in a table cell,
 * `text-foreground` in the hero — and the child stays subordinate to the parent
 * in both.
 */
export function CategoryPath({
  category,
  subcategory,
  fallback,
  className,
}: CategoryPathProps) {
  const root = category || fallback;
  if (!root) return null;

  return (
    <span className={cn(className)}>
      {root}
      {/* Only when a real category is shown — "Uncategorized › Serums" is nonsense. */}
      {category && subcategory && (
        <span className="opacity-70"> › {subcategory}</span>
      )}
    </span>
  );
}
