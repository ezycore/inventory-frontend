// coding-standard: maintained
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { productItemsCreateCallback } from "@/components/sales/helpers";
import type { ExtractedProduct } from "@/components/sales/types";
import { PERMISSIONS, useHasPermission } from "@/hooks/use-has-permission";
import { productsApi, useSelectOptions } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import { selectOptions } from "@/services/api/select-options";
import type { ProductFilters } from "@/types";
import { buildPosCatalog, type ProductMeta } from "./pos-catalog";

/**
 * Name, photo and category for every product, in one request. `all`/`fields`
 * are list params the backend's BaseService honours but `ProductFilters`
 * doesn't declare; the list populates category/sub-category names itself.
 */
const META_QUERY = {
  all: true,
  fields: "name,images,categoryId,subcategoryId",
} as unknown as ProductFilters;

/**
 * Everything the POS counter shows about products, with no backend change:
 * - the sellable rows (price, stock at this branch, barcode) — the same cached
 *   `/inventory/sellable-products` list the search box reads;
 * - photos and categories from the products list the Products page uses.
 *
 * The products list needs `products.view`. Without it there are no photos and
 * everything sits under one "Other" category — the counter still sells.
 */
export function usePosCatalog() {
  const t = useTranslations("sales.pos.browse");
  const canView = useHasPermission(PERMISSIONS.productsView);

  const { data: sellable = [], isLoading } = useSelectOptions(
    selectOptions("sellableProducts"),
    productItemsCreateCallback,
  );
  const { data: products } = useQuery({
    queryKey: queryKeys.products.list(META_QUERY),
    queryFn: () => productsApi.getAll(META_QUERY),
    select: (res) => res.data,
    enabled: canView,
    staleTime: 5 * 60_000,
  });

  const meta = useMemo(() => {
    const map = new Map<string, ProductMeta>();
    for (const product of products?.items ?? []) {
      const image = product.images?.[0];
      map.set(product._id, {
        name: product.name,
        photo: image?.thumbnailUrl || image?.url || undefined,
        categoryId: product.category?._id ?? product.categoryId ?? undefined,
        categoryName: product.category?.name,
        subcategoryId: product.subcategory?._id ?? product.subcategoryId ?? undefined,
        subcategoryName: product.subcategory?.name,
      });
    }
    return map;
  }, [products]);

  const photos = useMemo(() => {
    const map = new Map<string, string>();
    for (const [id, info] of meta) if (info.photo) map.set(id, info.photo);
    return map;
  }, [meta]);

  const catalog = useMemo(
    () => buildPosCatalog(sellable as unknown as ExtractedProduct[], meta, t("uncategorized")),
    [sellable, meta, t],
  );

  return { ...catalog, photos, isLoading };
}
