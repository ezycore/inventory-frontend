// coding-standard: maintained

/**
 * A user's display name.
 *
 * `lastName` is optional on the backend model and on every form that writes it,
 * so a `${firstName} ${lastName}` template renders "Ada undefined" for the users
 * who have none — owners created through signup included. Compose it here.
 */
export const fullName = (
  user:
    | { firstName?: string | null; lastName?: string | null }
    | null
    | undefined,
): string => `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();

/** Initials for an avatar fallback; same optional-last-name rule applies. */
export const initials = (
  user:
    | { firstName?: string | null; lastName?: string | null }
    | null
    | undefined,
): string =>
  `${user?.firstName?.charAt(0) ?? ""}${
    user?.lastName?.charAt(0) ?? ""
  }`.toUpperCase();
