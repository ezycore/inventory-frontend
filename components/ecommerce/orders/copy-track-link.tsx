"use client";
// coding-standard: maintained
import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/ui/components/button";
import { copyText } from "@/utils/clipboard";

/**
 * Copies the buyer's tracking link for a merchant to paste into the chat the
 * order came from.
 *
 * **This is the delivery mechanism, not a convenience.** No order SMS carries the
 * link — order notifications default to email-only for the customer, and a guest
 * has no email — so for a guest or a Messenger order this button is the only way
 * the buyer ever receives it. That is why it lives on the list row rather than
 * only in the detail sheet: a copy button you have to open a record to reach is
 * one nobody uses.
 *
 * **Copies a short line, not a bare URL.** The merchant is pasting into a chat,
 * where a naked link reads like spam.
 *
 * The sentence is composed on the FRONTEND, not taken from a backend notification
 * template: those are English-only with no locale axis today, and this must not
 * wait on that work. It is plain English here because the rest of the ecommerce
 * admin is — when that surface gets a message namespace, this string moves with it.
 */
export function CopyTrackLink({
  trackUrl,
  orderNumber,
  className,
}: {
  /** Built server-side against the store's public host — never assembled here. */
  trackUrl?: string;
  orderNumber: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  // Orders placed before tracking existed have no link. Rendering a dead button
  // would be worse than rendering nothing.
  if (!trackUrl) return null;

  const copy = async (event: React.MouseEvent) => {
    // The row opens the order on click; copying must not also navigate away.
    event.stopPropagation();
    try {
      await copyText(`Your order ${orderNumber} - track it here: ${trackUrl}`);
      setCopied(true);
      toast.success("Tracking link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access is denied over plain HTTP and in some embedded views.
      // Say so, rather than silently doing nothing.
      toast.error("Could not copy - copy the link manually");
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={copy}
      className={className}
      aria-label="Copy tracking link"
      title="Copy tracking link"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Link2 className="h-4 w-4" />
      )}
    </Button>
  );
}
