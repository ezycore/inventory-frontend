'use client';
// coding-standard: maintained

import { Mail } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/ui/components/popover';
import { useEmailSaleReceipt } from '@/services/api';
import type { Sale } from '@/types';

interface EmailReceiptButtonProps {
  sale: Sale;
}

/**
 * "Email receipt" action for a finalized sale. Opens a popover with the
 * recipient pre-filled from the customer's email on file when the caller has
 * it (sales history populates it; the sell page doesn't). An empty input is
 * allowed — the backend falls back to the email on file and rejects with a
 * clear error when there is none. Hidden for draft/cancelled sales (the
 * backend refuses those too).
 */
export function EmailReceiptButton({ sale }: EmailReceiptButtonProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const sendReceipt = useEmailSaleReceipt();

  if (sale.status === 'draft' || sale.status === 'cancelled') return null;

  const knownEmail = sale.customerId?.email;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setEmail(knownEmail ?? '');
  };

  const handleSend = async () => {
    try {
      await sendReceipt.mutateAsync({
        saleId: sale._id,
        email: email.trim() || undefined,
      });
      setOpen(false);
    } catch {
      // toast already shown by the mutation's onError
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="whitespace-nowrap"
        >
          <Mail className="h-4 w-4" />
          Email
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3">
        <div className="space-y-1">
          <Label htmlFor="receipt-email">Email receipt to</Label>
          <Input
            id="receipt-email"
            type="email"
            placeholder="customer@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
          />
          {!knownEmail && (
            <p className="text-xs text-muted-foreground">
              Leave empty to use the customer&apos;s email on file.
            </p>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          className="w-full"
          onClick={handleSend}
          disabled={sendReceipt.isPending}
        >
          {sendReceipt.isPending ? 'Sending…' : 'Send receipt'}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
