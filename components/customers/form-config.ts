// coding-standard: maintained
import { DynamicFormConfig } from "@/ui/components/form/type";

export const customerFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "name",
      type: "input",
      label: "Customer Name",
      placeholder: "Enter customer name",
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
      optionsApi:
        "/discounts/sales?all=true&status=active&fields=_id,name,value,isDefaultSales",
      defaultFlag: "isDefaultSales",
      description: "Applied automatically to sales for this customer",
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

export const defaultValues = {
  name: "",
  email: "",
  phone: "",
  address: "",
  defaultDiscountId: "",
  status: "active" as const,
};
