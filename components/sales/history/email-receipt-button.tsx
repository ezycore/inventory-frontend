'use client';
// coding-standard: maintained

import { useTranslations } from 'next-intl';
import { Mail } from 'lucide-react';
import { useRef, useState } from 'react';
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
import { populatedRef } from '@/utils/populated-ref';

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
  const t = useTranslations('sales.history.emailReceipt');
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const sendReceipt = useEmailSaleReceipt();

  // On open, Radix auto-focuses the input and selects its text. We prefer the
  // caret parked at the end so the prefilled email isn't wiped by the first
  // keystroke. `setSelectionRange` throws on type="email", so re-assign the
  // value instead — that lands the caret at the end with no selection.
  const focusInputAtEnd = (e: Event) => {
    e.preventDefault();
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    const value = el.value;
    el.value = '';
    el.value = value;
  };

  if (sale.status === 'draft' || sale.status === 'cancelled') return null;

  const knownEmail = populatedRef(sale.customerId)?.email;

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
          {t('email')}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 space-y-3"
        onOpenAutoFocus={focusInputAtEnd}
      >
        <div className="space-y-1">
          <Label htmlFor="receipt-email">{t('emailTo')}</Label>
          <Input
            ref={inputRef}
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
            <p className="text-xs text-muted-foreground">{t('leaveEmpty')}</p>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          className="w-full"
          onClick={handleSend}
          disabled={sendReceipt.isPending}
        >
          {sendReceipt.isPending ? t('sending') : t('send')}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
