"use client";

import { useWatch } from "react-hook-form";
import { Input } from "@/ui/components/input";
import { useSelectOptions } from "@/services/api";
import { cn } from "@/ui/lib/utils";

interface PriceFieldWithUnitProps {
  control: any;
  name: string;
  value?: number | string;
  onChange?: (val: number | "") => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  unitFieldName?: string;
}

/**
 * Price input that shows the selected base unit (e.g. "/ pcs") as a suffix.
 * The unit label is resolved from the form's `unitId` field by looking
 * it up in the cached `/units` options.
 *
 * Designed to be used as a `customComponent` in DynamicForm — the parent
 * helper wraps it in a Controller and forwards `value`/`onChange`.
 */
export default function PriceFieldWithUnit({
  control,
  value,
  onChange,
  onBlur,
  disabled,
  placeholder = "0.00",
  error,
  unitFieldName = "unitId",
}: PriceFieldWithUnitProps) {
  const unitId = useWatch({ control, name: unitFieldName });
  const { data: unitOptions = [] } = useSelectOptions("/units?all=true&fields=_id,name,shortName");

  const selected = unitOptions.find(
    (opt: any) => opt.value === unitId || (opt as any)._id === unitId,
  ) as any;
  const unitLabel: string | undefined =
    selected?.shortName || selected?.name || selected?.label;
  const suffix = unitLabel ? `/ ${unitLabel}` : "";

  return (
    <div className="relative w-full">
      <Input
        value={value ?? ""}
        onBlur={onBlur}
        type="number"
        placeholder={placeholder}
        disabled={disabled}
        min={0}
        step={1}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            onChange?.("");
            return;
          }
          const parsed = parseFloat(raw);
          onChange?.(isNaN(parsed) ? "" : parsed);
        }}
        className={cn(
          "w-full",
          suffix ? "pr-16" : "",
          error ? "border-red-500" : "",
        )}
      />
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs font-medium text-muted-foreground select-none">
          {suffix}
        </span>
      )}
    </div>
  );
}
