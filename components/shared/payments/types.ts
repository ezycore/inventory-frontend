/**
 * Document-agnostic shapes consumed by the shared payment components.
 * Sales and purchases each adapt their domain object (Sale / PurchaseOrder)
 * to these minimal contracts before delegating to the shared component.
 */
export interface PaymentDoc {
  status: string;
  dueAmount: number;
}

export interface CreditConfig {
  /** Counterparty credit balance available (customer or supplier). */
  available: number;
  /** Form-field label, e.g. "Use store credit" / "Use supplier credit". */
  label: string;
  /** Subtitle copy under the label. Defaults to "Available: …". */
  description?: string;
  /** Controlled toggle state. */
  enabled: boolean;
  /** Toggle setter. When toggled on, the parent typically caps `paymentAmount`. */
  setEnabled: (v: boolean) => void;
}
