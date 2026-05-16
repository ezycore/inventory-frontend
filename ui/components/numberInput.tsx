import { cn } from "../lib/utils";
import { Input } from "./input";

export function NumberInput({ className, onChange, ...props }: React.ComponentProps<typeof Input> & { onChange?: (value: number | "") => void }) {
 const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const raw = e.target.value;
  if (raw === "") {
   onChange?.("");
   return;
  }
  const parsed = parseFloat(raw);
  onChange?.(isNaN(parsed) ? "" : parsed);
 };

 return (
  <Input
   type="number"
   onChange={handleChange}
   className={cn(
    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
    className
   )}
   {...props}
  />
 );
}