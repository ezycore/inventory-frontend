import { unitsApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import { CreateUnitDto, Unit } from "@/types";
import { createResourceHooks } from "../query-helpers";

const unitHooks = createResourceHooks<Unit, CreateUnitDto>(
  unitsApi,
  queryKeys.units,
  { relatedQueryKeys: [queryKeys.products.all()] },
);

export const useUnits = unitHooks.useList;
export const useUnit = unitHooks.useDetail;
export const useCreateUnit = unitHooks.useCreate;
export const useUpdateUnit = unitHooks.useUpdate;
export const useDeleteUnit = unitHooks.useDelete;
