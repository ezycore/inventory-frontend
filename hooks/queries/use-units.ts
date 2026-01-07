import { unitsApi } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys-products";
import { CreateUnitDto, Unit } from "@/types";
import { createResourceHooks } from "./helper";

const unitHooks = createResourceHooks<Unit, CreateUnitDto>(
  unitsApi,
  queryKeys.units
);

export const useUnits = unitHooks.useList;
export const useUnit = unitHooks.useDetail;
export const useCreateUnit = unitHooks.useCreate;
export const useUpdateUnit = unitHooks.useUpdate;
export const useDeleteUnit = unitHooks.useDelete;

// Alias
export const useAddUnit = useCreateUnit;
