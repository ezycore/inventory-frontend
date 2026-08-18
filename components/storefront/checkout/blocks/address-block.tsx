"use client";
// coding-standard: maintained

import { ContactFields } from "@/components/storefront/checkout/blocks/contact-fields";
import { DeliveryFields } from "@/components/storefront/checkout/blocks/delivery-fields";
import type { CheckoutApi } from "@/components/storefront/checkout/use-checkout";

/**
 * Contact + delivery together, for the layouts that want one address section.
 *
 * The two halves are separate blocks so a layout that wants them in separate
 * cards (see `single`) can have that without re-implementing a field — this is
 * the *composition* of them, not the definition. `showHeading` passes straight
 * through: a layout that supplies its own section titles (`guided`) turns both
 * group labels off and takes responsibility for saying what the fields are.
 */
export function AddressBlock({
  api,
  showHeading = true,
}: {
  api: CheckoutApi;
  showHeading?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, marginBottom: 20 }}>
      <ContactFields api={api} showHeading={showHeading} />
      <DeliveryFields api={api} showHeading={showHeading} />
    </div>
  );
}
