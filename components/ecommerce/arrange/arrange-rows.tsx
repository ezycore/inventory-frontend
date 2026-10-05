"use client";
// coding-standard: maintained

import type { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { ProductThumb } from "@/components/sales/product-thumb";
import type { ProductOrderRow } from "@/services/api";
import { Button } from "@/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/ui/lib/utils";

/** Photo, name and the two facts that explain where a product lands: featured, and sold out. */
function ProductSummary({ row }: { row: ProductOrderRow }) {
  const { format } = useCurrency();
  return (
    <>
      <ProductThumb src={row.imageUrl ?? undefined} className="size-9" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{row.name}</div>
        <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          {row.price != null ? <span>{format(row.price)}</span> : null}
          {row.featured ? <span className="text-primary">Featured</span> : null}
          {row.purchasable ? null : (
            // D3: the shop still sinks a sold-out product below every buyable one,
            // wherever the merchant put it. Said here so the order never looks broken.
            <span className="text-amber-600 dark:text-amber-400">Out of stock · shows at the bottom</span>
          )}
        </div>
      </div>
    </>
  );
}

/** One product in the merchant's order: handle, position, product, and a menu of moves. */
export function PlacedRow({
  row,
  index,
  count,
  handle,
  readOnly,
  onMove,
  onMoveToPosition,
  onRemove,
}: {
  row: ProductOrderRow;
  index: number;
  count: number;
  /** The drag handle, or nothing while a search hides the rows it would move between. */
  handle: ReactNode;
  readOnly: boolean;
  onMove: (to: number) => void;
  onMoveToPosition: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-card py-1.5 pl-1 pr-1.5">
      {handle ?? <span className="w-6 shrink-0" />}
      <span className="w-7 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{index + 1}</span>
      <ProductSummary row={row} />
      {readOnly ? null : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              aria-label={`More for ${row.name}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled={index === 0} onSelect={() => onMove(0)}>
              Move to top
            </DropdownMenuItem>
            <DropdownMenuItem disabled={index === count - 1} onSelect={() => onMove(count - 1)}>
              Move to bottom
            </DropdownMenuItem>
            <DropdownMenuItem disabled={count < 2} onSelect={onMoveToPosition}>
              Move to position…
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onRemove}>Remove from order</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

/** A product the merchant has not placed: where the shop shows it today, and two ways to place it. */
export function UnplacedRow({
  row,
  readOnly,
  onPlace,
}: {
  row: ProductOrderRow;
  readOnly: boolean;
  onPlace: (where: "top" | "bottom") => void;
}) {
  return (
    <div className={cn("flex items-center gap-2 rounded-md border border-dashed py-1.5 pl-2 pr-1.5")}>
      <ProductSummary row={row} />
      {readOnly ? null : (
        <div className="flex shrink-0 gap-1">
          <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => onPlace("top")}>
            Add to top
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => onPlace("bottom")}>
            Add to bottom
          </Button>
        </div>
      )}
    </div>
  );
}
