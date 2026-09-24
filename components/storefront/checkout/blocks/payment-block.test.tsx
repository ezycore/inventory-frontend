// coding-standard: maintained
/**
 * The checkout's payment picker, once methods are merchant data.
 *
 * Two things it has to get right: every method reads in the merchant's own words
 * (not a platform label), and the notes and questions belonging to ONE method
 * appear only while that method is the one selected. The second is what makes
 * "send to this bKash number, then give me the TrxID" possible at all.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CheckoutApi } from "../use-checkout";
import { PaymentBlock } from "./payment-block";

const t = {
  paymentMethod: "Payment method",
  cod: "Cash on Delivery",
  bankTransfer: "Bank Transfer",
  customPayment: "Custom payment",
  default: "Default",
  optionalTag: "Optional",
  requiredTag: "Required",
};

const paymentMethods = [
  { id: "bkash", title: "bKash payment", subtitle: "Send Money, then enter the TrxID" },
  { id: "nagad", title: "Nagad" },
];

const customFields = [
  {
    key: "note",
    kind: "notice",
    label: "Send to 01XXXXXXXXX",
    slot: "after-payment",
    showWhen: { paymentMethods: ["bkash"] },
  },
  {
    key: "trx",
    kind: "input",
    label: "Transaction ID",
    type: "text",
    required: true,
    slot: "after-payment",
    showWhen: { paymentMethods: ["bkash"] },
  },
  {
    key: "nagad-ref",
    kind: "input",
    label: "Nagad reference",
    type: "text",
    slot: "after-payment",
    showWhen: { paymentMethods: ["nagad"] },
  },
];

const apiFor = (effectivePayment: string) =>
  ({
    t,
    store: { paymentMethods },
    methods: ["cod", "bkash", "nagad"],
    effectivePayment,
    setPayment: vi.fn(),
    customFields,
    customFieldAnswers: {},
    setCustomFieldAnswer: vi.fn(),
    errors: {},
    touch: vi.fn(),
  }) as unknown as CheckoutApi;

describe("PaymentBlock with merchant-defined methods", () => {
  it("lists every method in the merchant's own words", () => {
    render(<PaymentBlock api={apiFor("bkash")} />);

    expect(screen.getByText("bKash payment")).toBeInTheDocument();
    expect(screen.getByText("Nagad")).toBeInTheDocument();
    // `cod` is still ours, and still translated.
    expect(screen.getByText("Cash on Delivery")).toBeInTheDocument();
  });

  it("shows a merchant subtitle, and no built-in sub-line for COD", () => {
    render(<PaymentBlock api={apiFor("bkash")} />);

    expect(screen.getByText("Send Money, then enter the TrxID")).toBeInTheDocument();
    expect(screen.queryByText(/pay when your order arrives/i)).toBeNull();
  });

  it("shows only the selected method's note and fields", () => {
    render(<PaymentBlock api={apiFor("bkash")} />);

    expect(screen.getByText("Send to 01XXXXXXXXX")).toBeInTheDocument();
    expect(screen.getByText("Transaction ID")).toBeInTheDocument();
    // Nagad's question belongs to a method the shopper did not pick. Showing it
    // would demand a reference for a payment they are not making — and it is
    // `required`, so on the server it would be an order nobody can place.
    expect(screen.queryByText("Nagad reference")).toBeNull();
  });

  it("swaps the visible fields when a different method is selected", () => {
    render(<PaymentBlock api={apiFor("nagad")} />);

    expect(screen.getByText("Nagad reference")).toBeInTheDocument();
    expect(screen.queryByText("Transaction ID")).toBeNull();
    expect(screen.queryByText("Send to 01XXXXXXXXX")).toBeNull();
  });
});
