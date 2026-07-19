"use client";
// coding-standard: maintained
import type { ReactNode } from "react";
import { cn } from "@ui/lib/utils";
import { Button } from "@/ui/components/button";

/** Compact square toggle button shared across the rich-text toolbar. */
export function ToolButton({
  onClick,
  active,
  label,
  disabled,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn("size-8", active && "bg-accent text-accent-foreground")}
    >
      {children}
    </Button>
  );
}

export const ToolbarDivider = () => <div aria-hidden className="mx-1 h-5 w-px bg-border" />;
