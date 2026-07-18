// coding-standard: maintained
import type { ColumnSpan } from "./type";

// Read a nested value from an object by dot-separated path.
export const getNestedValue = (obj: any, path: string): any => {
  const keys = path.split(".");
  let current = obj;
  for (const key of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }
  return current;
};

// Grid column classes with responsive breakpoints (mobile-full → lg-span).
export const getColumnClass = (span: ColumnSpan): string => {
  const spanMap: Record<ColumnSpan, string> = {
    1: "col-span-12 sm:col-span-6 lg:col-span-1",
    2: "col-span-12 sm:col-span-6 lg:col-span-2",
    3: "col-span-12 sm:col-span-6 lg:col-span-3",
    4: "col-span-12 sm:col-span-6 lg:col-span-4",
    6: "col-span-12 sm:col-span-6 lg:col-span-6",
    8: "col-span-12 sm:col-span-6 lg:col-span-8",
    12: "col-span-12",
  };
  return spanMap[span] || "col-span-12";
};
