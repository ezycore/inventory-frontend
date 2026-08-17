// coding-standard: maintained
import { cn } from "@ui/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";

export interface SimpleSelectOption {
  label: string;
  value: string;
  disabled?: boolean;
  /**
   * One line under the label, inside the dropdown only — the trigger always
   * shows the label alone. This is what makes a select viable for a choice
   * whose options each need explaining: the sentences get the popover's full
   * width and cost the closed control nothing.
   */
  description?: string;
}

interface SimpleSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: SimpleSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
  id?: string;
  /** Trigger height preset — `sm` is h-8, `default` h-9. `className` overrides both. */
  size?: "sm" | "default";
  /** Native tooltip on the trigger. */
  title?: string;
  /**
   * Shown when `options` is empty. `ui/` sits below the i18n layer, so the
   * default is English — pass a translated string from a localised caller.
   */
  emptyMessage?: string;
}

export const SimpleSelect = ({
  value,
  onValueChange,
  options,
  placeholder = "Select an option...",
  disabled,
  className,
  error,
  id,
  size,
  title,
  emptyMessage = "No options available",
}: SimpleSelectProps) => {
  // Radix mirrors the selected item's `ItemText` into the trigger, so a
  // described option would print its whole paragraph there. Passing the label
  // as `SelectValue`'s children overrides that — and only when descriptions are
  // in play, so every existing caller keeps the default behaviour (including
  // the placeholder, which children would otherwise suppress).
  const described = options.some((opt) => opt.description);
  const selected = described
    ? options.find((opt) => opt.value === value)
    : undefined;

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        id={id}
        size={size}
        title={title}
        className={cn("w-full", error && "border-red-500", className)}
      >
        <SelectValue placeholder={placeholder}>
          {selected ? selected.label : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        position="popper"
        side="bottom"
        sideOffset={4}
      >
        {options.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          options.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
              className={cn(opt.description && "py-2")}
            >
              {opt.description ? (
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-xs leading-snug text-muted-foreground">
                    {opt.description}
                  </span>
                </span>
              ) : (
                opt.label
              )}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};

export default SimpleSelect;
