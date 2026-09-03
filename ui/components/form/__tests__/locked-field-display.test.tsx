import { renderWithProviders, screen } from "@/tests/test-utils";
import { FormField } from "@/ui/components/form/form-field";
import type { FormFieldConfig } from "@/ui/components/form/type";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";

const productTypeField: FormFieldConfig = {
  name: "productType",
  type: "radio-group",
  label: "Product type",
  options: [
    { value: "single", label: "Simple product" },
    { value: "variable", label: "Variable product" },
  ],
  lockedDisplay: (values) => (
    <span>{`${values.productType} product — type cannot be changed`}</span>
  ),
};

function ProductTypeField({ isEditMode }: { isEditMode: boolean }) {
  const form = useForm({ defaultValues: { productType: "variable" } });

  return (
    <FormField
      field={productTypeField}
      control={form.control}
      formState={form.formState}
      watch={form.watch}
      setValue={form.setValue}
      isEditMode={isEditMode}
      disabledFieldsInEdit={["productType"]}
    />
  );
}

describe("locked field display", () => {
  it("replaces an immutable radio group with explanatory context in edit mode", () => {
    renderWithProviders(<ProductTypeField isEditMode />);

    expect(screen.getByText("variable product — type cannot be changed")).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });

  it("keeps the radio choices available in create mode", () => {
    renderWithProviders(<ProductTypeField isEditMode={false} />);

    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.queryByText("variable product — type cannot be changed")).not.toBeInTheDocument();
  });
});
