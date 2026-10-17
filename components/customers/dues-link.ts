// coding-standard: maintained

/**
 * The customers list filtered to who owes money, biggest debt first.
 *
 * There is no separate dues page on purpose: this filter (`hasDues`, see
 * `filters.ts`) already answers "who owes me?" and orders by amount owed, so a
 * second screen would only be a second copy of the same rows. Everything that
 * points a merchant at their receivables links here instead — the dashboard
 * Receivable card and the Customers page totals.
 */
export const CUSTOMERS_WITH_DUES_URL = "/customers?hasDues=true";
