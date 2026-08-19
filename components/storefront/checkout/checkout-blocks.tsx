// coding-standard: maintained

/**
 * The pieces every checkout layout is built from.
 *
 * A layout decides **where these go and how many screens they span**; it never
 * re-implements one. That matters more here than anywhere else in the
 * storefront: these blocks are bound to `useCheckout`'s state, so a copy-pasted
 * field would be a field that silently stops feeding the order.
 *
 * Everything is inline-styled against the storefront CSS vars, so a block picks
 * up the merchant's brand colour, radius and density wherever a layout puts it.
 *
 * This file is the **barrel** — one import site for all four layouts, so the
 * blocks could be split by concern (address, payment, review, terms, summary)
 * without touching a single layout. Add a block to `blocks/`, re-export it here.
 */

export { FulfillmentToggle } from "@/components/storefront/checkout/blocks/fulfillment-toggle";
export { AddressBlock } from "@/components/storefront/checkout/blocks/address-block";
export { ContactFields } from "@/components/storefront/checkout/blocks/contact-fields";
export { DeliveryFields } from "@/components/storefront/checkout/blocks/delivery-fields";
export { OrderLines } from "@/components/storefront/checkout/blocks/order-lines";
export { SectionCard } from "@/components/storefront/checkout/blocks/section-card";
export { TrustStrip } from "@/components/storefront/checkout/blocks/trust-strip";
export { PaymentBlock } from "@/components/storefront/checkout/blocks/payment-block";
export { ReviewBlock } from "@/components/storefront/checkout/blocks/review-block";
export { TermsBlock } from "@/components/storefront/checkout/blocks/terms-block";
export {
  CouponRow,
  PlaceOrderButton,
  SummaryLines,
} from "@/components/storefront/checkout/blocks/summary-blocks";
