import { locationsApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";
import { CreateLocationDto, Location } from "@/types";
import { createResourceHooks } from "../query-helpers";

const locationHooks = createResourceHooks<Location, CreateLocationDto>(
  locationsApi,
  queryKeys.locations,
);

export const useLocations = locationHooks.useList; // used in CreatePurchaseOrderPage (will removed later)
export const useCreateLocation = locationHooks.useCreate; //used in locations page
export const useUpdateLocation = locationHooks.useUpdate; //used in locations page
export const useDeleteLocation = locationHooks.useDelete; //used in locations page
