import { queryKeys } from "@/services/api/query-keys";
import { tagsApi, type TagWriteDto } from "./api";
import type { ApiTag, TagListItem } from "@/types/api";
import { createResourceHooks } from "../query-helpers";

const tagHooks = createResourceHooks<ApiTag, TagWriteDto, TagWriteDto, TagListItem>(
  tagsApi,
  queryKeys.tags,
  {
    // Product rows embed tag chips, so a rename has to reach the product tables
    // as well as the tag list.
    events: ["catalog.changed"],
  },
);

export const useTagStats = tagHooks.useStats;
export const useTags = tagHooks.useList;
export const useTag = tagHooks.useDetail;
export const useTagBySlug = tagHooks.useBySlug!;
export const useCreateTag = tagHooks.useCreate;
export const useUpdateTag = tagHooks.useUpdate;
export const useDeleteTag = tagHooks.useDelete;
export const useBulkDeleteTag = tagHooks.useBulkDelete;
