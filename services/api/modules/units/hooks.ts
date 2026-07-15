import { unitsApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import { CreateUnitDto } from "@/types";
import type { ApiUnit } from "@/types/api";
import { createResourceHooks } from "../query-helpers";

const unitHooks = createResourceHooks<ApiUnit, CreateUnitDto>(
  unitsApi,
  queryKeys.units,
  { relatedQueryKeys: [queryKeys.products.all(), 
    [ "select-options", "/units?all=true&fields=_id,name,shortName"],
    [ "select-options", "/units?all=true&fields=_id,name,shortName,isDefault"]
  ] },
);

export const useUnits = unitHooks.useList;
export const useUnit = unitHooks.useDetail;
export const useCreateUnit = unitHooks.useCreate;
export const useUpdateUnit = unitHooks.useUpdate;
export const useDeleteUnit = unitHooks.useDelete;
