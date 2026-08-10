import { useState } from "react";
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
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await copyText(value);
      setCopied(true);
      toast.success("Copied!", { description: value });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy");
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
        aria-label="Copy to clipboard"
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