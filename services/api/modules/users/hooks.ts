import { invalidate } from "@/services/api/invalidation";
import { usersApi } from "@/services/api";
import { handleMutationError } from "@/lib/error-handling";
import { queryKeys } from "@/services/api/query-keys";
import type { CreateUserDto, UpdateUserDto } from "@/types/users";
import type { AdminUser } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createResourceHooks, handleMutationSuccess } from "../query-helpers";

// Create standard CRUD hooks using the factory
const userHooks = createResourceHooks<AdminUser, CreateUserDto, UpdateUserDto>(
  usersApi,
  queryKeys.users,
  { events: ["org.changed"] },
);

// Export standard hooks
export const useCreateUser = userHooks.useCreate; //used in users page
export const useUpdateUser = userHooks.useUpdate; //used in users page
export const useDeleteUser = userHooks.useDelete; //used in users page
export const useUserStats = userHooks.useStats;

// Custom hook for toggling user status (deactivate/activate) //in use in users page custom actions
export function useToggleUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersApi.toggleStatus(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
      handleMutationSuccess(
        response.message || "User status updated successfully",
      );
    },
    onError: handleMutationError,
  });
}

/** Get current user's accessible locations (in use changeDefaultLocationDialog) */
export function useMyLocations() {
  return useQuery({
    queryKey: queryKeys.users.myLocations(),
    queryFn: () => usersApi.getMyLocations(),
  });
}

/** Update current user's default location (in use changeDefaultLocationDialog) */
export function useUpdateMyDefaultLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (locationId: string) =>
      usersApi.updateMyDefaultLocation(locationId),
    onSuccess: () => {
      invalidate(queryClient, "org.changed");
      handleMutationSuccess("Default location updated successfully");
    },
    onError: handleMutationError,
  });
}
