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
      // This page sits behind `storefront.manage`, the same permission the
      // upload endpoint requires — so the button can never 403 here.
      allowImages: true,
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
    // Search-engine overrides. `title` above is the page heading and may run to
    // 160 characters; a search result wants ~70, so these are separate fields
    // rather than a reuse. Empty falls back to the heading (and, for the
    // description, to nothing at all — which is what shipped before).
    {
      name: "seo.title",
      type: "input",
      label: "Search title (optional)",
      placeholder: "Falls back to the page title",
      validation: { maxLength: 70 },
      columnSpan: 6,
    },
    {
      name: "seo.description",
      type: "input",
      label: "Search description (optional)",
      placeholder: "One or two sentences shown under the link in Google",
      validation: { maxLength: 200 },
      columnSpan: 6,
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
  seo: { title: "", description: "" },
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
