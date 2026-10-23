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
