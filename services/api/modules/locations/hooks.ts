import { locationsApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import { CreateLocationDto } from "@/types";
import type { ApiLocation } from "@/types/api";
import { createResourceHooks } from "../query-helpers";

const locationHooks = createResourceHooks<ApiLocation, CreateLocationDto>(
  locationsApi,
  queryKeys.locations,
);

export const useLocations = locationHooks.useList; // used in CreatePurchaseOrderPage (will removed later)
export const useCreateLocation = locationHooks.useCreate; //used in locations page
export const useUpdateLocation = locationHooks.useUpdate; //used in locations page
export const useDeleteLocation = locationHooks.useDelete; //used in locations page
export const useLocationStats = locationHooks.useStats;
