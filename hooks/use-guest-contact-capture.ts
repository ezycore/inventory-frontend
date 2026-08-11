// coding-standard: maintained

import { useCallback, useRef } from "react";
import { storefrontApi } from "@/lib/storefront-client";
import { cartAnonymousId, isSfPreview } from "@/services/storefront/cart-identity";

/** The checkout fields worth recording on a guest's mirrored cart. */
type GuestField = "name" | "phone" | "email";

/**
 * Records a **guest's** checkout details onto their mirrored cart as they leave
 * each field, so an abandoned checkout is something the merchant can act on.
 *
 * Without it the abandoned-cart list can only ever say "Guest · not reachable"
 * — even for a shopper who typed their phone number and then closed the tab,
 * which is precisely the recoverable cart. `CartSync` cannot do this itself: the
 * values live in the checkout form's state, not in the cart store it watches.
 *
 * Three rules it inherits from the rest of the cart mirror
 * (`components/storefront/cart-sync.tsx`), all deliberate:
 *
 * - **Guests only.** A signed-in shopper's account already carries their contact
 *   details, and the merchant's list reads those instead.
 * - **Never in the Customize preview** — a merchant theming their shop is not a
 *   shopper.
 * - **Fire-and-forget, always.** This is merchant visibility on a money path: it
 *   swallows every failure and is never awaited, so it cannot delay or break a
 *   checkout.
 *
 * Each field is sent at most once per distinct value, so tabbing back and forth
 * through a form costs one request per actual edit.
 */
export function useGuestContactCapture(slug: string, enabled: boolean) {
  const sent = useRef<Partial<Record<GuestField, string>>>({});

  return useCallback(
    (field: GuestField, rawValue: string) => {
      if (!enabled || !slug || isSfPreview()) return;
      const value = rawValue.trim();
      // An empty field is "not filled in yet", never "forget what you know" —
      // the server ignores blanks for the same reason.
      if (!value || sent.current[field] === value) return;

      const anonymousId = cartAnonymousId(slug);
      if (!anonymousId) return;

      sent.current[field] = value;
      void storefrontApi
        .captureCartContact(slug, { anonymousId, [field]: value })
        .catch(() => {
          // Let the next blur retry rather than leaving the merchant with a
          // half-identified cart because the shopper was briefly offline.
          delete sent.current[field];
        });
    },
    [slug, enabled],
  );
}
