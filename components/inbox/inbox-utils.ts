// coding-standard: maintained
/**
 * Small display helpers for the Inbox (`components/inbox/*`). Pure, so they are tested
 * without rendering.
 */

/**
 * Up to two initials for the avatar. Facebook gives us no profile photo for most customers
 * (backend `docs/features/inbox.md` §4), so the initials ARE the avatar. Works for Bangla
 * names too — it takes the first character of the first and last word, whatever the script.
 */
export function initialsOf(name: string | undefined | null): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = Array.from(words[0])[0] ?? "";
  const last = words.length > 1 ? (Array.from(words[words.length - 1])[0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** The attachment types with their own label in `inbox.thread.attachment`; anything else is `other`. */
const KNOWN_ATTACHMENTS = ["image", "video", "audio", "file"] as const;
export type AttachmentKind = (typeof KNOWN_ATTACHMENTS)[number] | "other";

/** Meta's attachment `type` → the message key that names it. */
export function attachmentKind(type: string): AttachmentKind {
  return (KNOWN_ATTACHMENTS as readonly string[]).includes(type) ? (type as AttachmentKind) : "other";
}

/** The `#oauthError=` codes the settings screen has its own sentence for; anything else is `failed`. */
const KNOWN_OAUTH_ERRORS = ["cancelled", "INBOX_OAUTH_SESSION_INVALID", "INBOX_OAUTH_UNAVAILABLE"] as const;
export type OAuthReturnError = (typeof KNOWN_OAUTH_ERRORS)[number] | "failed";

/**
 * The result of the "Connect with Facebook" round trip, read off the settings URL fragment the
 * backend redirected to: `#oauth=<grant>` (the encrypted sign-in blob) or `#oauthError=<code>`.
 * `null` when the fragment is neither — an ordinary visit.
 */
export function readOAuthReturn(hash: string): { grant?: string; error?: OAuthReturnError } | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const grant = params.get("oauth");
  if (grant) return { grant };
  const error = params.get("oauthError");
  if (error === null) return null;
  return {
    error: (KNOWN_OAUTH_ERRORS as readonly string[]).includes(error) ? (error as OAuthReturnError) : "failed",
  };
}
