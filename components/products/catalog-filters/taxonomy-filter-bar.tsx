"use client";
// coding-standard: maintained

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useSelectOptions } from "@/services/api/modules/use-select-options";
import { selectOptions } from "@/services/api/select-options";
import { SimpleSelect } from "@/ui/components/simple-select";
import { taxonomyChoices, type TaxonomyFields, type TaxonomyFilter } from "./taxonomy-filter";

const ALL = "all";
const TAG_OPTIONS = selectOptions("tags", { fields: "_id,name" });

/**
 * Category → sub-category → tag, for the one-page product screens. The sub-category select shows
 * only once a category with children is picked, and lists only those children; the tag select
 * lists only tags some row carries. Picking a new category clears the sub-category, which could
 * not belong to it.
 */
export function TaxonomyFilterBar({
  rows,
  value,
  onChange,
}: {
  rows: TaxonomyFields[];
  value: TaxonomyFilter;
  onChange: (next: TaxonomyFilter) => void;
}) {
  const t = useTranslations("products.products.catalogFilters");
  const choices = useMemo(() => taxonomyChoices(rows), [rows]);
  const { data: allTags } = useSelectOptions(choices.tagIds.size ? TAG_OPTIONS : null);
  const tags = (allTags ?? []).filter((tag) => choices.tagIds.has(String(tag.value)));
  const subcategories = choices.subcategoriesOf(value.categoryId);
  const pick = (v: string) => (v === ALL ? null : v);

  return (
    <>
      <SimpleSelect
        value={value.categoryId ?? ALL}
        onValueChange={(v) => onChange({ ...value, categoryId: pick(v), subcategoryId: null })}
        options={[{ value: ALL, label: t("allCategories") }, ...choices.categories.map((c) => ({ value: c.id, label: c.name }))]}
        className="w-full sm:w-48"
      />
      {subcategories.length > 0 && (
        <SimpleSelect
          value={value.subcategoryId ?? ALL}
          onValueChange={(v) => onChange({ ...value, subcategoryId: pick(v) })}
          options={[{ value: ALL, label: t("allSubcategories") }, ...subcategories.map((c) => ({ value: c.id, label: c.name }))]}
          className="w-full sm:w-48"
        />
      )}
      {tags.length > 0 && (
        <SimpleSelect
          value={value.tagId ?? ALL}
          onValueChange={(v) => onChange({ ...value, tagId: pick(v) })}
          options={[{ value: ALL, label: t("allTags") }, ...tags.map((tag) => ({ value: String(tag.value), label: tag.label }))]}
          className="w-full sm:w-44"
        />
      )}
    </>
  );
}
