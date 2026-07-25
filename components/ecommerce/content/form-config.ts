// coding-standard: maintained
import type { FilterConfig } from "@/types/DataTable";
import type { DynamicFormConfig } from "@/ui/components/form/type";

export const contentFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "title",
      type: "input",
      label: "Title",
      placeholder: "e.g. About Us",
      required: true,
      columnSpan: 6,
    },
    {
      name: "slug",
      type: "input",
      label: "Slug (URL)",
      placeholder: "about",
      required: true,
      columnSpan: 6,
    },
    {
      name: "body",
      type: "richtext",
      label: "Body",
      helperText:
        'Format text with the toolbar. "Add Q&A" inserts a styled FAQ card shown on the storefront.',
      columnSpan: 12,
    },
    {
      name: "published",
      type: "switch",
      label: "Published",
      columnSpan: 4,
      defaultValue: false,
    },
    {
      name: "showInFooter",
      type: "switch",
      label: "Show in footer",
      columnSpan: 4,
      defaultValue: true,
    },
    {
      name: "sortOrder",
      type: "number",
      precision: 0,
      zodType: "number",
      label: "Footer order",
      placeholder: "0",
      columnSpan: 4,
      defaultValue: 0,
    },
  ],
};

export const contentDefaultValues = {
  title: "",
  slug: "",
  body: "",
  published: false,
  showInFooter: true,
  sortOrder: 0,
};

export const contentFilterConfig: FilterConfig = {
  fields: [
    {
      name: "search",
      label: "Search pages",
      type: "text",
      placeholder: "Search by title or slug...",
    },
    {
      name: "published",
      label: "Status",
      type: "select",
      placeholder: "All",
      options: [
        { label: "Published", value: "true" },
        { label: "Draft", value: "false" },
      ],
    },
  ],
  viewMode: "popover",
};
