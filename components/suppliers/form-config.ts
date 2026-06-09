import type { DynamicFormConfig } from "@/ui/components/form/type";

export const supplierFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "name",
      type: "input",
      label: "Supplier Name",
      placeholder: "Enter supplier name",
      required: true,
      columnSpan: 12,
      validation: { minLength: 1, maxLength: 100 },
    },
    {
      name: "email",
      type: "input",
      label: "Email",
      placeholder: "Enter email address",
      columnSpan: 6,
    },
    {
      name: "phone",
      type: "input",
      label: "Phone",
      placeholder: "Enter phone number",
      columnSpan: 6,
    },
    {
      name: "address",
      type: "textarea",
      label: "Address",
      placeholder: "Enter address",
      columnSpan: 12,
    },
    {
      name: "defaultDiscountId",
      type: "select",
      label: "Default Discount",
      placeholder: "Select a default discount (optional)",
      columnSpan: 6,
      optionsApi: "/discounts/purchase?all=true&status=active&fields=_id,name,value",
      description: "Applied automatically to purchases from this supplier",
      creatable: true,
      quickAddModule: "discount"
    },
    {
      name: "status",
      type: "select",
      label: "Status",
      required: true,
      columnSpan: 6,
      defaultValue: "active",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ],
};
