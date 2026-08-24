// coding-standard: maintained

/** The referral field signup sends to the backend, when the URL carries one. */
export interface SignupReferralFromUrl {
  referralCode?: string;
}

/**
 * Reads `?ref=CODE` from the URL and carries it through the signup call.
 *
 * The code comes from a merchant's own referral URL (Settings → Referrals) or an
 * MC-minted partner link (`plan/referral-commission-system.md` §4/§6). Mirrors
 * `getSignupPlanFromUrl` (`utils/signup-plan.ts`): never validated client-side —
 * `auth.service.signup` forwards whatever is present, and Mission Control silently
 * no-ops on an unknown/disabled code rather than rejecting it, so a stale or
 * mistyped `ref` must never block a real signup.
 *
 * **Sends nothing when the URL carries no `ref`** — same "absent, not guessed"
 * shape as the plan reader.
 */
export function getSignupReferralFromUrl(): SignupReferralFromUrl {
  const params = new URLSearchParams(window.location.search);
  const referralCode = params.get("ref")?.trim();

  return referralCode ? { referralCode } : {};
}
