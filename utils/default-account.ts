// coding-standard: maintained

/**
 * The account a payment picker starts on: the org's default account
 * (Cash & Bank → "Set as default"), or the only account when there is just one.
 * `""` when neither — the merchant picks.
 *
 * Every money form asks "which account", and the answer is the default far more
 * often than not; most forms used to open on an empty select, so each payment
 * took an extra pick (and a forgotten one failed validation or posted nothing).
 *
 * Pickers keep the merchant's own pick in state and fall back to this while that
 * is empty — `picked || defaultAccountId(accounts)` — rather than copying it into
 * state in an effect, because the account list arrives after the form opens.
 */
export function defaultAccountId(
  accounts: readonly { _id: string; isDefault?: boolean }[] | undefined,
): string {
  if (!accounts?.length) return "";
  return (
    accounts.find((account) => account.isDefault)?._id ??
    (accounts.length === 1 ? accounts[0]._id : "")
  );
}
