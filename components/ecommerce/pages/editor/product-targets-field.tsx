"use client";
// coding-standard: maintained

import { useState } from "react";
import type { CatalogProduct } from "@/lib/storefront-client";
import {
  MAX_PRODUCT_TARGETS,
  showsOnProduct,
  type ProductTargets,
} from "@/lib/storefront-builder/product-targets";
import { Label } from "@/ui/components/label";
import { SimpleSelect } from "@/ui/components/simple-select";
import { RefField } from "./ref-field";

type Mode = "all" | "categories" | "tags";

const MODES: { value: Mode; label: string }[] = [
  { value: "all", label: "Every product" },
  { value: "categories", label: "Products in these categories" },
  { value: "tags", label: "Products with these tags" },
];

const modeOf = (targets?: ProductTargets): Mode =>
  targets?.categories?.length ? "categories" : targets?.tags?.length ? "tags" : "all";

/**
 * Which products a section on the product page shows on — a size guide for the
 * cushions and not the floor mats. Every section there appears under every
 * product unless it is limited here; the product section itself never is.
 *
 * The mode is held here as well as derived from what is stored: a merchant who
 * picks "categories" has named none yet, and nothing is stored until they do —
 * an empty list would mean "no products", which is what hiding a section is for.
 */
export function ProductTargetsField({
  id,
  targets,
  previewProduct,
  onChange,
}: {
  id: string;
  targets?: ProductTargets;
  /** The product the preview is drawn around, to say when this section is not on it. */
  previewProduct?: CatalogProduct | null;
  onChange: (targets: ProductTargets | undefined) => void;
}) {
  const [mode, setMode] = useState<Mode>(modeOf(targets));
  const ids = mode === "categories" ? targets?.categories : mode === "tags" ? targets?.tags : undefined;
  const missing = previewProduct && !showsOnProduct(targets, previewProduct);

  return (
    <div className="space-y-2">
      <Label htmlFor={`${id}-products`}>Products</Label>
      <SimpleSelect
        id={`${id}-products`}
        value={mode}
        options={MODES}
        onValueChange={(next) => {
          setMode(next as Mode);
          onChange(undefined);
        }}
      />
      {mode === "all" ? null : (
        <>
          <RefField
            id={`${id}-product-targets`}
            to={mode === "categories" ? "category" : "tag"}
            multiple
            max={MAX_PRODUCT_TARGETS}
            value={ids ?? []}
            onChange={(next) => {
              const list = Array.isArray(next) ? next.filter((item): item is string => typeof item === "string") : [];
              onChange(list.length ? { [mode]: list } : undefined);
            }}
          />
          <p className="text-xs text-muted-foreground">
            {ids?.length
              ? mode === "categories"
                ? "Choosing a category includes the categories inside it."
                : "Shows on a product carrying any of these tags."
              : "Choose at least one — until then it shows on every product."}
          </p>
        </>
      )}
      {missing ? (
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Not shown on {previewProduct.name}, the product in the preview. Choose one it shows on from
          Previewing, above the preview, to check it.
        </p>
      ) : null}
    </div>
  );
}
