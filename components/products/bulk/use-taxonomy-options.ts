// coding-standard: maintained
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { categoriesApi, tagsApi } from "@/services/api";
import { queryKeys } from "@/services/api/query-keys";

export interface TaxonomyOption {
  value: string;
  label: string;
}

interface CategoryRow {
  _id: string;
  name: string;
  parentId?: string | null;
}

interface TagRow {
  _id: string;
  name: string;
  status?: string;
}

/**
 * Tags and categories as picker options for the bulk editors. One read of each —
 * sub-categories are split out of the same category list by `parentId`, so
 * picking a category never waits on a second request.
 */
export const useTaxonomyOptions = () => {
  const tagsQuery = useQuery({
    queryKey: queryKeys.tags.list({ all: true, fields: "_id,name,status" }),
    queryFn: () => tagsApi.getAll({ all: true, fields: "_id,name,status" }),
  });
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list({ all: true, fields: "_id,name,parentId" }),
    queryFn: () => categoriesApi.getAll({ all: true, fields: "_id,name,parentId" }),
  });

  return useMemo(() => {
    const tagRows = (tagsQuery.data?.data?.items ?? []) as TagRow[];
    const categoryRows = (categoriesQuery.data?.data?.items ?? []) as CategoryRow[];
    const byName = (a: TaxonomyOption, b: TaxonomyOption) => a.label.localeCompare(b.label);

    const toOption = (row: { _id: string; name: string }) => ({ value: row._id, label: row.name });
    const subcategoriesOf = (categoryId: string | null) =>
      categoryId
        ? categoryRows
            .filter((row) => row.parentId && String(row.parentId) === categoryId)
            .map(toOption)
            .sort(byName)
        : [];

    return {
      isLoading: tagsQuery.isLoading || categoriesQuery.isLoading,
      /** Every tag — removing an inactive one is how it gets cleaned up. */
      allTags: tagRows.map(toOption).sort(byName),
      /** Active tags only — the server refuses to add an inactive one. */
      activeTags: tagRows.filter((row) => row.status !== "inactive").map(toOption).sort(byName),
      categories: categoryRows.filter((row) => !row.parentId).map(toOption).sort(byName),
      subcategoriesOf,
    };
  }, [tagsQuery.data, tagsQuery.isLoading, categoriesQuery.data, categoriesQuery.isLoading]);
};
