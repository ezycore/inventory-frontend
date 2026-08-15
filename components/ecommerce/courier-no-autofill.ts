// coding-standard: maintained

/**
 * Keep browser + password-manager autofill out of the courier credential inputs.
 *
 * Pathao's own field set is `clientId / clientSecret / username / password`, so
 * the form renders as a textbook login form and Chrome fills the admin's saved
 * ezycore email + password into it. Because the inputs are controlled and
 * autofill dispatches `input` events, those values reach React state and get
 * SAVED as the courier's credentials — silently breaking dispatch with a 502
 * (Pathao's token endpoint answers 500, not 401, when it rejects credentials, and
 * `courierFetch` maps every 5xx to 502).
 *
 * `autoComplete="off"` does not help: Chrome ignores it on password fields by
 * design. `new-password` is the one value it honours, and the `data-*` opt-outs
 * cover the third-party managers. Spread onto EVERY credential field, not just
 * the secrets — the classifier fills the *text* field next to a password field
 * just as eagerly, which is exactly how the Client ID got an email address.
 *
 * Pair it with a non-semantic `name` (see `courier-cred-form.tsx`): with no
 * `name` at all, classifiers fall back to the id (`pathao-username`) and match.
 */
export const NO_AUTOFILL: Record<string, string> = {
  autoComplete: "new-password",
  "data-1p-ignore": "true", // 1Password
  "data-lpignore": "true", // LastPass
  "data-bwignore": "true", // Bitwarden
  "data-form-type": "other", // Dashlane
};
