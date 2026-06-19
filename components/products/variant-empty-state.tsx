"use client";

import { Layers } from "lucide-react";
import { Button } from "@/ui/components/button";

interface VariantEmptyStateProps {
  /** Switches the product type to "variable" to enable variants. */
  onMakeVariable?: () => void;
  disabled?: boolean;
}

/**
 * Empty state shown in the Variants section when the product is "single".
 * The "Make variable" button switches the product type to "variable",
 * which reveals the VariantManager.
 */
export default function VariantEmptyState({
  onMakeVariable,
  disabled,
}: VariantEmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <Layers className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          This product is set as <span className="font-medium text-foreground">Single</span>.
          Use variants when the same product comes in different sizes, colors,
          strengths, etc.
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => onMakeVariable?.()}
        className="shrink-0"
      >
        Make variable
      </Button>
    </div>
  );
}
