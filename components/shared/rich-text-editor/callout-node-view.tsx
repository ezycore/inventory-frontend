"use client";
// coding-standard: maintained
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Info, X } from "lucide-react";
import { cn } from "@ui/lib/utils";
import { Button } from "@/ui/components/button";
import type { RichDocCalloutVariant } from "@/lib/storefront-rich-doc";

/**
 * Admin-editor chrome for the callout node (callout-node.ts): a variant switcher
 * + delete button around the editable body. Editor-only styling; the storefront
 * look lives in components/storefront/rich-doc-callout-view.tsx. All buttons are
 * type="button" — the editor mounts inside DynamicForm's <form>.
 */
const VARIANT_META: Record<RichDocCalloutVariant, { label: string; cls: string }> = {
  info: { label: "Info", cls: "border-blue-400 bg-blue-500/10" },
  warning: { label: "Warning", cls: "border-amber-400 bg-amber-500/10" },
  success: { label: "Success", cls: "border-emerald-400 bg-emerald-500/10" },
};
const VARIANTS = Object.keys(VARIANT_META) as RichDocCalloutVariant[];

export function CalloutView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const variant: RichDocCalloutVariant = VARIANTS.includes(node.attrs.variant)
    ? node.attrs.variant
    : "info";
  return (
    <NodeViewWrapper
      className={cn("relative my-3 rounded-lg border-l-4 py-2 pr-9 pl-3", VARIANT_META[variant].cls)}
    >
      <div contentEditable={false} className="mb-1 flex items-center gap-1">
        <Info className="size-3.5 text-muted-foreground" />
        {VARIANTS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => updateAttributes({ variant: v })}
            className={cn(
              "rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors",
              v === variant
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {VARIANT_META[v].label}
          </button>
        ))}
      </div>
      <NodeViewContent />
      <div contentEditable={false} className="absolute top-1.5 right-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => deleteNode()}
          aria-label="Remove callout"
          className="size-6 text-muted-foreground hover:text-destructive"
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </NodeViewWrapper>
  );
}
