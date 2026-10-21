"use client";
// coding-standard: maintained

import type { CatalogRelated } from "@/types/api";
import { SafeImage } from "@/ui/components/safeImage";
import { cn } from "@/ui/lib/utils";

type PreviewItem = CatalogRelated["preview"]["items"][number];

/** The row shows four unless the merchant changed it in Pages → Product. */
const DEFAULT_SHOWN = 4;

/** Why a product is in the row — the merchant's answer to "why is a mat on my cushion?". */
export function relatedReason(item: Pick<PreviewItem, "reason" | "tagNames">): string {
  switch (item.reason) {
    case "picked":
      return "Your pick";
    case "subcategory":
      return "Same sub-category";
    case "tags":
      return item.tagNames?.length ? `Shared tag: ${item.tagNames.join(", ")}` : "Shared tag";
    case "category":
      return "Same category";
    default:
      return "From your store";
  }
}

/**
 * "What shoppers see now" — the shop's own "You may also like" row for this product, from the
 * saved state, each with why it is there (docs/plan/related-products-and-stock-left.md). Rows past
 * the default four are dimmed: they show only on a page set to show more.
 */
export function RelatedPreview({ preview }: { preview: CatalogRelated["preview"] | undefined }) {
  if (!preview) return null;
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground">What shoppers see now</div>
      {!preview.listed ? (
        <p className="text-xs text-muted-foreground">
          This product isn’t in your store, so it has no “You may also like” row.
        </p>
      ) : preview.items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No other product matches yet. Add a sub-category, a tag or a category, or pick products above.
        </p>
      ) : (
        <>
          <ol className="grid gap-1.5 sm:grid-cols-2" aria-label="You may also like, in order">
            {preview.items.map((item, index) => (
              <li
                key={String(item._id)}
                className={cn(
                  "flex min-w-0 items-center gap-2 rounded-md border p-1.5",
                  index >= DEFAULT_SHOWN && "opacity-50",
                )}
              >
                <span className="w-4 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{index + 1}</span>
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded bg-muted">
                  {item.image?.thumbnailUrl || item.image?.url ? (
                    <SafeImage
                      src={item.image.thumbnailUrl || item.image.url}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium" title={item.name}>
                    {item.name}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground" title={relatedReason(item)}>
                    {relatedReason(item)}
                  </div>
                </div>
              </li>
            ))}
          </ol>
          {preview.items.length > DEFAULT_SHOWN ? (
            <p className="text-xs text-muted-foreground">
              Your product page shows the first {DEFAULT_SHOWN} unless you changed it in Online Store → Pages → Product.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
