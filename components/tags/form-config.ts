// coding-standard: maintained
import { DynamicFormConfig } from "@/ui/components/form/type";
import type { Translator } from "@/i18n/config";

/**
 * Tag form.
 *
 * Shorter than brand/category on purpose: a tag is a chip, so there is no image
 * and no `isDefault` — a default tag would silently label the whole catalog,
 * which is not what a label means.
 */
const COLOR_PRESETS = [
  { value: "#2563eb", label: "Blue" },
  { value: "#16a34a", label: "Green" },
  { value: "#dc2626", label: "Red" },
  { value: "#7c3aed", label: "Purple" },
  { value: "#ea580c", label: "Orange" },
  { value: "#0891b2", label: "Teal" },
  { value: "#57534e", label: "Grey" },
];

/**
 * Static English config — `config/quickAddConfig.ts` and the settings/fields
 * visibility tool run at module scope and cannot call `useTranslations`. The
 * Tags page itself uses `getTagFormConfig(t)`.
 */
export const tagFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "name",
      type: "input",
      label: "Tag Name",
      placeholder: "e.g. Eid Special",
      required: true,
      columnSpan: 12,
      validation: { minLength: 1, maxLength: 50 },
    },
    {
      name: "description",
      type: "textarea",
      label: "Description",
      placeholder: "What this tag is for",
      rows: 2,
      columnSpan: 12,
      validation: { maxLength: 200 },
    },
    {
      name: "color",
      type: "select",
      label: "Colour",
      placeholder: "Pick a chip colour",
      columnSpan: 12,
      options: COLOR_PRESETS,
    },
    {
      name: "group",
      type: "input",
      label: "Filter group",
      placeholder: "e.g. Fabric, Occasion",
      columnSpan: 12,
      validation: { maxLength: 40 },
    },
    {
      name: "showOnCard",
      type: "switch",
      label: "Show on product cards",
      columnSpan: 12,
      defaultValue: true,
    },
    {
      name: "cardPriority",
      type: "number",
      precision: 0,
      label: "Card priority",
      placeholder: "1–99",
      columnSpan: 12,
      validation: { min: 1, max: 99 },
    },
    {
      name: "status",
      type: "select",
      label: "Status",
      required: true,
      columnSpan: 12,
      defaultValue: "active",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ],
};

export const getTagFormConfig = (t: Translator): DynamicFormConfig => ({
  fields: [
    {
      name: "name",
      type: "input",
      label: t("form.name"),
      placeholder: t("form.namePlaceholder"),
      required: true,
      columnSpan: 12,
      validation: { minLength: 1, maxLength: 50 },
    },
    {
      name: "description",
      type: "textarea",
      label: t("form.description"),
      placeholder: t("form.descriptionPlaceholder"),
      rows: 2,
      columnSpan: 12,
      validation: { maxLength: 200 },
    },
    {
      name: "color",
      type: "select",
      label: t("form.color"),
      placeholder: t("form.colorPlaceholder"),
      columnSpan: 12,
      options: COLOR_PRESETS,
    },
    {
      // The storefront filter heading this tag files under (filter plan C2).
      name: "group",
      type: "input",
      label: t("form.group"),
      placeholder: t("form.groupPlaceholder"),
      helperText: t("form.groupHint"),
      columnSpan: 12,
      validation: { maxLength: 40 },
    },
    {
      // Card chip controls (docs/plan/product-card-badges.md). The product page
      // shows every tag whatever these say — they only decide the card.
      name: "showOnCard",
      type: "switch",
      label: t("form.showOnCard"),
      helperText: t("form.showOnCardHint"),
      columnSpan: 12,
      defaultValue: true,
    },
    {
      name: "cardPriority",
      type: "number",
      precision: 0,
      label: t("form.cardPriority"),
      placeholder: t("form.cardPriorityPlaceholder"),
      helperText: t("form.cardPriorityHint"),
      columnSpan: 12,
      validation: { min: 1, max: 99 },
    },
    {
      name: "status",
      type: "select",
      label: t("form.status"),
      required: true,
      columnSpan: 12,
      defaultValue: "active",
      options: [
        { value: "active", label: t("form.statusActive") },
        { value: "inactive", label: t("form.statusInactive") },
      ],
    },
  ],
});
