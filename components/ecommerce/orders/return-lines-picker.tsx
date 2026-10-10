// coding-standard: maintained
import { Label } from "@/ui/components/label";
import { NumberField } from "@/ui/components/number-field";

/** `productId|variantId` — two sizes of one product are two lines, and the server matches on both. */
export const returnLineKey = (item: { productId: unknown; variantId?: unknown }) =>
  `${String(item.productId)}|${item.variantId ? String(item.variantId) : ""}`;

/**
 * How many of each order line came back. Used by the collection dialog, where a part-refused
 * parcel is recorded together with what was collected.
 *
 * Shown whether or not the shop tracks stock: with stock off nothing is restocked, but a refused
 * item still comes off the sale — hiding the picker there left a stock-free shop no way to record
 * which items the customer refused (found on UriiBaba, 2026-10-10).
 */
export function ReturnLinesPicker({
  items,
  value,
  onChange,
}: {
  items: { productId: unknown; variantId?: unknown; productName: string; quantity: number }[];
  value: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <Label>Items that came back</Label>
      <div className="space-y-1.5 rounded-md border p-3">
        {items.map((item) => {
          const key = returnLineKey(item);
          return (
            <div key={key} className="flex items-center justify-between gap-3">
              <span className="min-w-0 flex-1 truncate text-sm">
                {item.productName}
                <span className="ml-1 text-xs text-muted-foreground">× {item.quantity}</span>
              </span>
              <NumberField
                precision={0}
                min={0}
                max={item.quantity}
                value={value[key] ?? 0}
                onChange={(v) => onChange({ ...value, [key]: v ?? 0 })}
                className="h-8 w-24"
                aria-label={`Return ${item.productName}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
