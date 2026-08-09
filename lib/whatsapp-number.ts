// coding-standard: maintained

/**
 * Pull a displayable phone number out of whatever a merchant saved as their
 * WhatsApp contact.
 *
 * That field accepts anything — most owners paste the share link WhatsApp hands
 * them (`https://api.whatsapp.com/send/?phone=8801905886067&text&type=phone_number&app_absent=0`),
 * some paste `wa.me/…`, some type the number. `hrefFor` in
 * `components/storefront/social-links.tsx` already copes with all of those on
 * the LINK side; this is the display side of the same problem, and it is a
 * standalone module (no component imports) so the admin can use it without
 * pulling the storefront icon set into its bundle.
 *
 * Without it the Customize panel rendered the raw 90-character URL where a
 * phone number belongs, which truncated to a meaningless `…end/?phone=8801…`
 * and pushed the row's layout around.
 *
 * Returns "" for a blank input, and returns the input untouched when it is
 * neither phone-shaped nor a link we recognise — the caller still truncates, so
 * an unrecognised value degrades to "something odd is saved here" rather than
 * to a confident lie.
 */
export function whatsappNumberLabel(value: string | undefined | null): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";

  // Already a phone number — show it exactly as the owner typed it.
  if (/^[\d\s+()-]+$/.test(raw)) return raw;

  // `?phone=8801…` — the api.whatsapp.com/send share link.
  const query = /[?&]phone=(\d{6,})/.exec(raw)?.[1];
  if (query) return `+${query}`;

  // `wa.me/8801…`, `whatsapp.com/message/…` and friends: digits in the path.
  const path = /(?:wa\.me|whatsapp\.com)\/(?:send\/)?(\d{6,})/.exec(raw)?.[1];
  if (path) return `+${path}`;

  return raw;
}
