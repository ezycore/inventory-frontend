import { useQuery } from "@tanstack/react-query";
import { stockMovementsApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export const useStockMovements = (filters: {
 product_id?: string;
 variant_id?: string;
 location_id?: string;
 reason?: string;
 movement_type?: string;
 start_date?: string;
 end_date?: string;
 page?: number;
 limit?: number;
} = {}) => {
 return useQuery({
  queryKey: queryKeys.stockMovements.list(filters),
  queryFn: () => stockMovementsApi.getAll(filters),
 });
};

export const useInventoryHistory = (
 productId: string,
 locationId: string,
 variantId?: string
) => {
 return useQuery({
  queryKey: queryKeys.stockMovements.inventoryHistory(productId, locationId, variantId),
  queryFn: () => stockMovementsApi.getInventoryHistory(productId, locationId, variantId),
  enabled: !!productId && !!locationId,
 });
};
