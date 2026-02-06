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

interface ResourceApi<T, CreateDto, UpdateDto> {
  getAll?: (
    filters?: Record<string, any>,
  ) => Promise<ApiResponse<PaginatedResponse<any>>>;
  getById?: (id: string) => Promise<ApiResponse<any>>;
  getBySlug?: (slug: string) => Promise<ApiResponse<any>>;
  create?: (data: FormData | CreateDto) => Promise<ApiResponse<any>>;
  update?: (id: string, data: FormData | UpdateDto) => Promise<ApiResponse<T>>;
  delete?: (id: string) => Promise<ApiResponse<any>>;
  bulkDelete?: (ids: string[]) => Promise<ApiResponse<any>>;
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
  T,
  CreateDto = any,
  UpdateDto = Partial<CreateDto>,
>(
  api: ResourceApi<T, CreateDto, UpdateDto>,
  queryKeys: QueryKeys,
  options: FactoryOptions = {},
) {
  const { staleTime = 10 * 60 * 1000, relatedQueryKeys = [] } = options;

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
  };
}
