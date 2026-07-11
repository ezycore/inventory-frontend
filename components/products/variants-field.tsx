"use client";
// coding-standard: maintained

import { useWatch } from "react-hook-form";
import VariantManager from "./variant-manager";
import VariantEmptyState from "./variant-empty-state";

interface VariantsFieldProps {
  control: any;
  setValue?: (name: string, value: any, options?: any) => void;
  value?: any[];
  onChange?: (variants: any[]) => void;
  disabled?: boolean;
}

/**
 * Variants section body, bound to the `variants` field. Shows the
 * VariantManager when the product type is "variable", otherwise an empty
 * state whose "Make variable" button flips `productType` via setValue.
 *
 * Used as a `customComponent` in DynamicForm.
 */
export default function VariantsField({
  control,
  setValue,
  value,
  onChange,
  disabled,
}: VariantsFieldProps) {
  const productType = useWatch({ control, name: "productType" });

  if (productType === "variable") {
    return <VariantManager control={control} value={value} onChange={onChange} />;
  }

  return (
    <VariantEmptyState
      disabled={disabled}
      onMakeVariable={() =>
        setValue?.("productType", "variable", {
          shouldValidate: true,
          shouldDirty: true,
        })
      }
    />
  );
}
