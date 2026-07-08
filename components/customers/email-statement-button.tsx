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
import { useEmailCustomerStatement } from '@/services/api';
import type { Customer } from '@/types';

interface EmailStatementButtonProps {
  customer: Customer;
  /** Account-wide outstanding due; the button hides when it's exactly 0. */
  totalDue?: number;
}

/**
 * "Email statement" action on the customer ledger. Sends the customer an
 * outstanding-dues statement (open invoices + total). Recipient pre-fills
 * from the customer's email on file; an empty input lets the backend use the
 * email on file (it rejects with a clear error when there is none).
 */
export function EmailStatementButton({ customer, totalDue }: EmailStatementButtonProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const sendStatement = useEmailCustomerStatement();

  if (totalDue === 0) return null;

  const knownEmail = customer.email;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setEmail(knownEmail ?? '');
  };

  const handleSend = async () => {
    try {
      await sendStatement.mutateAsync({
        customerId: customer._id,
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
          <Label htmlFor="statement-email">Email statement to</Label>
          <Input
            id="statement-email"
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
          disabled={sendStatement.isPending}
        >
          {sendStatement.isPending ? 'Sending…' : 'Send statement'}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
