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
}: SimpleSelectProps) => {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger id={id} className={cn("w-full", error && "border-red-500", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        side="bottom"
        sideOffset={4}
      >
        {options.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No options available
          </div>
        ) : (
          options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};

export default SimpleSelect;