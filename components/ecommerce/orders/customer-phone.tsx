"use client";
// coding-standard: maintained
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/ui/lib/utils";
import { copyText } from "@/utils/clipboard";

/**
 * The buyer's number, on the list row.
 *
 * **On a COD business the phone IS the customer.** It is the join key the repeat-
 * buyer chip is built on (`shippingAddress.phoneKey`), the only handle a guest
 * order has, what a shopper quotes on a follow-up call, and what the merchant
 * searches to find the Messenger thread an order came from. The list showed the
 * name alone, so the one identifier that is actually unique was the one thing a
 * merchant had to open an order to read — for every row, on a screen whose whole
 * job is triage.
 *
 * **Copy on click, rather than a `tel:` link.** Calling matters — `no_answer` is
 * a rejection reason — but a `tel:` href on a desktop browser with no handler
 * does nothing at all, and a dead affordance on the busiest screen in the product
 * is worse than plain text. Copy behaves identically everywhere, and pasting the
 * number into a chat is the more common move anyway: most of these orders arrived
 * in one.
 *
 * It has to be *some* affordance rather than a bare span. The row navigates on
 * click, so text sitting inside it cannot practically be selected — putting the
 * number there without giving it its own action would show the merchant the thing
 * they need and then take it away.
 */
export function CustomerPhone({
  phone,
  className,
}: {
  phone?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  // A guest order always carries one, but an order edited down to nothing, or an
  // older row, may not. Rendering an empty clickable line would be noise.
  if (!phone) return null;

  const copy = async (event: React.MouseEvent) => {
    // The row opens the order on click; copying must not also navigate away.
    // Same guard, and the same reason, as `CopyTrackLink` beside it.
    event.stopPropagation();
    try {
      await copyText(phone);
      setCopied(true);
      toast.success("Phone number copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access is denied over plain HTTP and in some embedded views.
      // Say so, rather than silently doing nothing.
      toast.error("Could not copy - copy the number manually");
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title="Copy phone number"
      className={cn(
        // `tabular-nums` so a column of numbers lines up digit for digit, which
        // is what makes two similar numbers distinguishable at a glance.
        "w-fit text-left text-xs tabular-nums text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      {copied ? "Copied" : phone}
    </button>
  );
}
