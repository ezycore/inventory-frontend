'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/ui/components/button';

export function CopyableInvoice({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`Copied ${value}`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Failed to copy');
    }
  };
  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-mono font-medium text-primary">{value}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-5 w-5"
        onClick={handleCopy}
        aria-label={`Copy ${value}`}
      >
        {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
      </Button>
    </span>
  );
}
