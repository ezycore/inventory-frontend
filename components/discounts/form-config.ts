import { DynamicFormConfig } from "@/ui/components/form/type";

export const discountFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "name",
      type: "input",
      label: "Discount Name",
      placeholder: "Enter discount name",
      required: true,
      columnSpan: 12,
    },
    {
      name: "value",
      type: "number",
      label: "Discount Value",
      placeholder: "Enter discount value",
      required: true,
      columnSpan: 6,
    },
    {
      name: "type",
      type: "select",
      label: "Type",
      required: true,
      columnSpan: 6,
      defaultValue: "percentage",
      options: [
        { value: "percentage", label: "Percentage" },
        // { value: "fixed", label: "Fixed Amount" },
      ],
    },
    {
      name: "applicableTo",
      type: "select",
      label: "Applicable To",
      required: true,
      columnSpan: 6,
      options: [
        { value: "both", label: "Both (Sales & Purchase)" },
        { value: "sales", label: "Sales Only" },
        { value: "purchase", label: "Purchase Only" },
      ],
    },
    {
      name: "status",
      type: "select",
      label: "Status",
      required: true,
      columnSpan: 6,
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
    {
      name: "description",
      type: "textarea",
      label: "Description",
      placeholder: "Optional description for this discount",
      columnSpan: 12,
    },
  ],
};
