"use client";
// coding-standard: maintained

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/ui/components/checkbox";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { SimpleSelect } from "@/ui/components/simple-select";
import type { ProductBulkAction } from "@/services/api/modules/products/api";
import { useTaxonomyOptions } from "./use-taxonomy-options";

export type BulkOp = ProductBulkAction["op"];

/** The form state behind one bulk action, before it is turned into a request. */
export interface BulkFieldsValue {
  tagIds: string[];
  categoryId: string;
  subcategoryId: string;
}

export const emptyBulkFields: BulkFieldsValue = { tagIds: [], categoryId: "", subcategoryId: "" };

/** Sentinel for "take the products out of every category" in the category select. */
export const NO_CATEGORY = "__none__";

/** Form state → request action, or `null` while the form is incomplete. */
export const toBulkAction = (op: BulkOp, value: BulkFieldsValue): ProductBulkAction | null => {
  if (op === "setCategory") {
    if (!value.categoryId) return null;
    if (value.categoryId === NO_CATEGORY) return { op, categoryId: null, subcategoryId: null };
    return { op, categoryId: value.categoryId, subcategoryId: value.subcategoryId || null };
  }
  return value.tagIds.length ? { op, tagIds: value.tagIds } : null;
};

interface BulkActionFieldsProps {
  op: BulkOp;
  value: BulkFieldsValue;
  onChange: (value: BulkFieldsValue) => void;
}

/**
 * The inputs for one bulk action: a tag checklist for add/remove, a category +
 * sub-category pair for a move. Shared by the selection bar's dialog, the
 * paste-a-list dialog and the category page's "move products".
 */
export function BulkActionFields({ op, value, onChange }: BulkActionFieldsProps) {
  const t = useTranslations("products.products.bulk");
  const options = useTaxonomyOptions();
  const [search, setSearch] = useState("");

  const tagOptions = op === "addTags" ? options.activeTags : options.allTags;
  const visibleTags = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? tagOptions.filter((tag) => tag.label.toLowerCase().includes(term)) : tagOptions;
  }, [search, tagOptions]);

  if (op !== "setCategory") {
    const toggle = (id: string, checked: boolean) =>
      onChange({
        ...value,
        tagIds: checked ? [...value.tagIds, id] : value.tagIds.filter((tagId) => tagId !== id),
      });

    return (
      <div className="space-y-2">
        <Label>{t("tagsLabel")}</Label>
        {tagOptions.length > 8 && (
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("tagsSearch")}
            className="h-8"
          />
        )}
        <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
          {!options.isLoading && tagOptions.length === 0 && (
            <p className="px-1 py-2 text-sm text-muted-foreground">{t("noTags")}</p>
          )}
          {visibleTags.map((tag) => (
            <label
              key={tag.value}
              className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 text-sm hover:bg-accent"
            >
              <Checkbox
                checked={value.tagIds.includes(tag.value)}
                onCheckedChange={(checked) => toggle(tag.value, checked === true)}
              />
              {tag.label}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {op === "addTags" ? t("addNote") : t("removeNote")}
        </p>
      </div>
    );
  }

  const subcategories =
    value.categoryId && value.categoryId !== NO_CATEGORY
      ? options.subcategoriesOf(value.categoryId)
      : [];

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>{t("categoryLabel")}</Label>
        <SimpleSelect
          value={value.categoryId}
          onValueChange={(categoryId) => onChange({ ...value, categoryId, subcategoryId: "" })}
          options={[{ value: NO_CATEGORY, label: t("noCategory") }, ...options.categories]}
          placeholder={t("categoryPlaceholder")}
        />
      </div>
      {subcategories.length > 0 && (
        <div className="space-y-2">
          <Label>{t("subcategoryLabel")}</Label>
          <SimpleSelect
            value={value.subcategoryId || NO_CATEGORY}
            onValueChange={(subcategoryId) =>
              onChange({ ...value, subcategoryId: subcategoryId === NO_CATEGORY ? "" : subcategoryId })
            }
            options={[{ value: NO_CATEGORY, label: t("subcategoryNone") }, ...subcategories]}
          />
        </div>
      )}
      <p className="rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
        {t("categoryWarning")}
      </p>
    </div>
  );
}
