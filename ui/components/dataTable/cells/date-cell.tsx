import React from "react";

export interface DateCellProps {
  value: string | Date;
  format?: "short" | "long";
  className?: string;
}

export function DateCell({ 
  value, 
  format = "short",
  className = "text-sm"
}: DateCellProps) {
  const date = new Date(value);
  
  const formatted = format === "short" 
    ? date.toLocaleDateString()
    : date.toLocaleString();
  
  return (
    <span className={className}>
      {formatted}
    </span>
  );
}