"use client";
// coding-standard: maintained

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { copyText } from "@/utils/clipboard";

interface CopyFieldProps {
  value: string;
  showValue?: boolean;
  className?: string;
}

export function CopyField({ value, showValue = true, className }: CopyFieldProps) {
  // These three strings were English literals until 2026-08-17, in a component
  // used in nine places — DNS instructions, both payments drawers, both returns
  // columns, stock movements, order details, role details — so a Bangla merchant
  // met English on every copy action in the product.
  const t = useTranslations("common.copy");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await copyText(value);
      setCopied(true);
      toast.success(t("done"), { description: value });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("failed"));
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showValue && (
        <span className="text-sm text-foreground">{value}</span>
      )}
      <button
        onClick={handleCopy}
        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
        aria-label={t("label")}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}