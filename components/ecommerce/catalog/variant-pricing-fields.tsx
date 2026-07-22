"use client";
// coding-standard: maintained

import type { CatalogVariant } from "@/services/api";
import { Label } from "@/ui/components/label";
import { NumberField } from "@/ui/components/number-field";
import { formatMoney } from "@/components/storefront/format";

/** One variant's editable storefront pricing (null = sell at the base price / no strike). */
export interface VariantPriceDraft {
  onlinePrice: number | null;
  compareAtPrice: number | null;
}

/**
 * Catalog editor → the per-variant online pricing rows for a VARIABLE product.
 * Each variant gets its own Online price (overrides the POS price online) and a
 * Compare-at "was" price. Variable products can't be priced at the product level,
 * so this replaces the single-product price inputs in `ProductOnlineEditor`.
 */
export function VariantPricingFields({
  variants,
  value,
  onChange,
  currency,
  loading,
}: {
  variants: CatalogVariant[];
  value: Record<string, VariantPriceDraft>;
  onChange: (variantId: string, patch: Partial<VariantPriceDraft>) => void;
  currency?: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <p className="text-xs text-muted-foreground">Loading variants…</p>
    );
  }
  if (!variants.length) {
    return (
      <p className="text-xs text-muted-foreground">
        This product has no variants yet. Add options in Products first.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {variants.map((v) => {
        const draft = value[v._id] ?? { onlinePrice: null, compareAtPrice: null };
        return (
          <div key={v._id} className="rounded-lg border p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{v.label || "Variant"}</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                Base {formatMoney(v.price ?? 0, currency)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Online price</Label>
                <NumberField
                  min={0}
                  precision={2}
                  value={draft.onlinePrice}
                  onChange={(n) => onChange(v._id, { onlinePrice: n })}
                  placeholder={
                    v.price != null ? formatMoney(v.price, currency) : "Base price"
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Compare-at</Label>
                <NumberField
                  min={0}
                  precision={2}
                  value={draft.compareAtPrice}
                  onChange={(n) => onChange(v._id, { compareAtPrice: n })}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
