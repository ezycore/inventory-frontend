"use client";
// coding-standard: maintained

import { useEffect, useState } from "react";
import { useCatalogRelated, useSetCatalogRelated } from "@/services/api";
import { selectOptions } from "@/services/api/select-options";
import { ProductListField } from "@/components/ecommerce/pages/editor/product-list-field";
import { Label } from "@/ui/components/label";
import { Switch } from "@/ui/components/switch";
import { RelatedPreview } from "./related-preview";

/** The same option list the other product pickers search (CLAUDE.md → "Product pickers"). */
const PRODUCTS = selectOptions("products", { fields: "_id,name" });
/** The most the storefront row shows — backend `MAX_RELATED_PICKS`. */
const MAX_PICKS = 8;

/**
 * The editor's draft of one product's hand-picked related products
 * (docs/plan/related-products-and-stock-left.md §A5), saved inside the listing's own Save.
 */
export function useRelatedPicksDraft(productId: string | null) {
  const { data } = useCatalogRelated(productId);
  const setRelated = useSetCatalogRelated();
  const [picks, setPicks] = useState<string[]>([]);
  const [pickedOnly, setPickedOnly] = useState(false);

  const savedIds = (data?.picks ?? []).map((pick) => String(pick._id));
  const savedKey = `${productId}:${savedIds.join(",")}:${data?.pickedOnly}`;
  useEffect(() => {
    setPicks(savedIds);
    setPickedOnly(!!data?.pickedOnly);
    // Re-seed only when the saved picks themselves change, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedKey]);

  const dirty =
    !!data && (picks.join(",") !== savedIds.join(",") || (picks.length > 0 && pickedOnly !== !!data.pickedOnly));
  const notes = Object.fromEntries(
    (data?.picks ?? []).filter((pick) => !pick.shown).map((pick) => [String(pick._id), "Not shown in the store"]),
  );

  return {
    preview: data?.preview,
    picks,
    setPicks,
    pickedOnly,
    setPickedOnly,
    notes,
    dirty,
    pending: setRelated.isPending,
    save: () =>
      productId
        ? setRelated.mutateAsync({ id: productId, productIds: picks, pickedOnly: picks.length > 0 && pickedOnly })
        : Promise.resolve(undefined),
  };
}

export type RelatedPicksDraft = ReturnType<typeof useRelatedPicksDraft>;

/** "You may also like" for this product: the merchant's picks, then the automatic match. */
export function RelatedProductsCard({ productId, draft }: { productId: string; draft: RelatedPicksDraft }) {
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div>
        <div className="text-sm font-medium">Related products</div>
        <p className="text-xs text-muted-foreground">
          Shown first in “You may also like” on this product’s page. Leave empty to pick automatically: same sub-category, then shared tags, then same category.
        </p>
      </div>
      <ProductListField
        id="related-products"
        optionsApi={PRODUCTS}
        value={draft.picks}
        onChange={draft.setPicks}
        max={MAX_PICKS}
        exclude={[productId]}
        notes={draft.notes}
      />
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label htmlFor="related-picked-only">Show only these</Label>
          <p className="text-xs text-muted-foreground">Off: the automatic match fills the rest of the row.</p>
        </div>
        <Switch
          id="related-picked-only"
          checked={draft.picks.length > 0 && draft.pickedOnly}
          disabled={draft.picks.length === 0}
          onCheckedChange={draft.setPickedOnly}
        />
      </div>
      <RelatedPreview preview={draft.preview} />
    </div>
  );
}
