"use client";

import { useWatch } from "react-hook-form";
import { Wand2 } from "lucide-react";
import { Input } from "@/ui/components/input";
import { Button } from "@/ui/components/button";
import { cn } from "@/ui/lib/utils";

interface SkuInputProps {
  control: any;
  value?: string;
  onChange?: (val: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  /** Field name to derive a suggested SKU from (default: "name"). */
  sourceFieldName?: string;
}

/**
 * Build a readable SKU suggestion from a product name, e.g.
 * "Nexum Mups 20mg Capsule" -> "NEX-MUP-4821".
 * Falls back to a generic "SKU-####" when the source is empty.
 */
const generateSku = (source: string): string => {
  const suffix = Math.floor(1000 + Math.random() * 9000).toString();
  const words = (source || "")
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (words.length === 0) return `SKU-${suffix}`;

  const prefix = words
    .map((w) => w.slice(0, 3).toUpperCase())
    .join("-");
  return `${prefix}-${suffix}`;
};

/**
 * SKU text input with a one-click "generate" action that derives a suggested
 * code from the product name. No backend call — the suggestion is client-side,
 * and leaving the field empty lets the backend auto-generate on save.
 *
 * Used as a `customComponent` in DynamicForm (Controller-wrapped by the parent).
 */
export default function SkuInput({
  control,
  value,
  onChange,
  onBlur,
  disabled,
  placeholder = "e.g. NEX-020",
  error,
  sourceFieldName = "name",
}: SkuInputProps) {
  const source = useWatch({ control, name: sourceFieldName });

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value ?? ""}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn("w-full font-mono", error ? "border-red-500" : "")}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={disabled}
        title="Generate SKU from name"
        aria-label="Generate SKU from name"
        onClick={() => onChange?.(generateSku(source))}
        className="shrink-0"
      >
        <Wand2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
