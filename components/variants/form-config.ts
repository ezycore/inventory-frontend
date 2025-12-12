import { DynamicFormConfig } from "@/ui/components/form/type";

// Form configuration
const variantAttributeFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "name",
      type: "input",
      label: "Attribute Name",
      placeholder: "Enter attribute name (e.g., Color, Size, Material)",
      required: true,
      columnSpan: 12,
      validation: {
        minLength: 2,
        maxLength: 50,
      },
    },
    {
      name: "values",
      type: "textarea",
      label: "Attribute Values",
      placeholder: "Enter values separated by commas (e.g., Red, Blue, Green)",
      required: true,
      rows: 3,
      columnSpan: 12,
      helperText: "Separate multiple values with commas",
      validation: {
        minLength: 1,
      },
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


export default variantAttributeFormConfig;