// coding-standard: maintained
import type { AccountType } from "@/types";

/** The method a payment is recorded with — the backend `paymentMethodSchema`. */
export type PaymentMethod = "cash" | "card" | "bank" | "mfs" | "other";

/**
 * The method a payment from this account is — read off the account, not asked for.
 *
 * Every payment form already makes the merchant choose the account the money
 * leaves, and the account's type IS the method: a Cash account pays in cash, a
 * bank account by bank, bKash/Nagad by mobile money. A second "Payment Method"
 * select beside it only asked the same question again, and could contradict it
 * (Bank account · Cash). A custom account is "other"; no account (store/supplier
 * credit) sends nothing and the server records it as credit.
 */
export function paymentMethodForAccount(
  type?: AccountType | string,
): PaymentMethod {
  switch (type) {
    case "cash":
      return "cash";
    case "bank":
      return "bank";
    case "mfs":
      return "mfs";
    default:
      return "other";
  }
}
