// hooks/factories/useResourceFactory.ts
import { handleMutationError } from "@/lib/error-handling";
import { ApiResponse, PaginatedResponse } from "@/types";
import {
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * `TDetail` is the shape `getById` / `create` / `update` return; `TList` is one row of the
 * paginated `getAll` result (often a slimmer projection, so it is a separate generic that
 * defaults to `TDetail`). Both flow through to the `select`ed hook data below, so a component
 * reading a field the backend doesn't send is now a compile error instead of a silent
 * `undefined`. Methods a resource types as `ApiResponse<any>` still satisfy this — `any` is
 * assignable both ways — so modules can be tightened one at a time.
 */
interface ResourceApi<TDetail, CreateDto, UpdateDto, TList = TDetail> {
  getAll?: (
    filters?: Record<string, any>,
  ) => Promise<ApiResponse<PaginatedResponse<TList>>>;
  getById?: (id: string) => Promise<ApiResponse<TDetail>>;
  getBySlug?: (slug: string) => Promise<ApiResponse<TDetail>>;
  create?: (data: FormData | CreateDto) => Promise<ApiResponse<TDetail>>;
  update?: (
    id: string,
    data: FormData | UpdateDto,
  ) => Promise<ApiResponse<TDetail>>;
  delete?: (id: string) => Promise<ApiResponse<any>>;
  bulkDelete?: (ids: string[]) => Promise<ApiResponse<any>>;
  getStats?: (filters?: Record<string, any>) => Promise<ApiResponse<any>>;
}

interface QueryKeys {
  all: () => QueryKey;
  list: () => QueryKey;
  detail: (id: string) => QueryKey;
  bySlug?: (slug: string) => QueryKey;
}

interface FactoryOptions {
  staleTime?: number;
  relatedQueryKeys?: QueryKey[]; // For invalidating related queries
}

export const handleMutationSuccess = (message: string | string[]) => {
  if (Array.isArray(message) && message.length > 0) {
    message.forEach((msg) => {
      toast.success(msg);
    });
  } else if (typeof message === "string" && message) {
    toast.success(message);
  }
};

export function createResourceHooks<
  TDetail,
  CreateDto = any,
  UpdateDto = Partial<CreateDto>,
  TList = TDetail,
>(
  api: ResourceApi<TDetail, CreateDto, UpdateDto, TList>,
  queryKeys: QueryKeys,
  options: FactoryOptions = {},
) {
  const { staleTime = 10 * 60 * 1000, relatedQueryKeys = [] } = options;

  const useStats = api.getStats
    ? () => {
        return useQuery({
          queryKey: queryKeys.list(),
          queryFn: () => api.getStats!({}),
          select: (data) => data.data,
          staleTime,
        });
      }
    : undefined;

  // Query hook for list
  const useList = api.getAll
    ? (filters?: Record<string, any>) => {
        return useQuery({
          queryKey: queryKeys.list(),
          queryFn: () => api.getAll!(filters),
          select: (data) => data.data,
          staleTime,
        });
      }
    : undefined;

  // Query hook for single item by ID
  const useDetail = api.getById
    ? (id: string) => {
        return useQuery({
          queryKey: queryKeys.detail(id),
          queryFn: () => api.getById!(id),
          enabled: !!id,
          select: (data) => data.data,
          staleTime,
        });
      }
    : undefined;

  // Query hook for single item by slug (optional)
  const useBySlug =
    api.getBySlug && queryKeys.bySlug
      ? (slug: string) => {
          return useQuery({
            queryKey: queryKeys.bySlug!(slug),
            queryFn: () => api.getBySlug!(slug),
            enabled: !!slug,
            select: (data) => data.data,
            staleTime,
          });
        }
      : undefined;

  // Mutation hook for create
  const useCreate = api.create
    ? () => {
        const queryClient = useQueryClient();

        return useMutation({
          mutationFn: (data: FormData | CreateDto) => api.create!(data),
          onSuccess: (data) => {
            handleMutationSuccess(data.message || "Item created successfully");
            queryClient.invalidateQueries({ queryKey: queryKeys.all() });
            relatedQueryKeys.forEach((key) => {
              queryClient.invalidateQueries({ queryKey: key });
            });
          },
          onError: handleMutationError,
        });
      }
    : undefined;

  // Mutation hook for update
  const useUpdate = api.update
    ? () => {
        const queryClient = useQueryClient();

        return useMutation({
          mutationFn: (data: FormData | ({ id: string } & UpdateDto)) => {
            if (data instanceof FormData) {
              const id = data.get("id") as string;
              return api.update!(id, data);
            }
            const { id, ...rest } = data;
            return api.update!(id, rest as UpdateDto);
          },
          onSuccess: (_, variables) => {
            handleMutationSuccess(_.message || "Item updated successfully");
            const id =
              variables instanceof FormData
                ? (variables.get("id") as string)
                : variables.id;

            queryClient.invalidateQueries({ queryKey: queryKeys.all() });
            queryClient.invalidateQueries({ queryKey: queryKeys.detail(id) });
            relatedQueryKeys.forEach((key) => {
              queryClient.invalidateQueries({ queryKey: key });
            });
          },
          onError: handleMutationError,
        });
      }
    : undefined;

  // Mutation hook for delete
  const useDelete = api.delete
    ? () => {
        const queryClient = useQueryClient();

        return useMutation({
          mutationFn: (id: string) => api.delete!(id),
          onSuccess: (data) => {
            handleMutationSuccess(data.message || "Item deleted successfully");
            queryClient.invalidateQueries({ queryKey: queryKeys.all() });
            relatedQueryKeys.forEach((key) => {
              queryClient.invalidateQueries({ queryKey: key });
            });
          },
          onError: handleMutationError,
        });
      }
    : undefined;

  // Mutation hook for bulk delete
  const useBulkDelete = api.bulkDelete
    ? () => {
        const queryClient = useQueryClient();

        return useMutation({
          mutationFn: (ids: string[]) => api.bulkDelete!(ids),
          onSuccess: (data: any) => {
            handleMutationSuccess(
              data?.message || "Items deleted successfully",
            );
            queryClient.invalidateQueries({ queryKey: queryKeys.all() });
            relatedQueryKeys.forEach((key) => {
              queryClient.invalidateQueries({ queryKey: key });
            });
          },
          onError: handleMutationError,
        });
      }
    : undefined;

  return {
    useList,
    useDetail,
    useBySlug,
    useCreate,
    useUpdate,
    useDelete,
    useBulkDelete,
    useStats,
  };
}
